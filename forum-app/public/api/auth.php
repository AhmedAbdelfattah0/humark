<?php
// CORS HEADERS - must be set before any output
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS request early
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// CONTENT TYPE
header("Content-Type: application/json; charset=UTF-8");

// ERROR REPORTING
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// DEPENDENCIES
require_once __DIR__ . '/config/database.php';
include_once '../utils/jwt.php';

// ROUTING
$action = $_GET['action'] ?? null;

switch ($action) {
    case 'login':
        login();
        break;
    case 'register':
        register();
        break;
    case 'register-admin':
        $data = json_decode(file_get_contents("php://input"));
        registerAdmin($data->name, $data->email, $data->password, $data->tenant_id);
        break;
    case 'createTenant':
        createTenant();
        break;
    case 'logout':
        logout();
        break;
    default:
        http_response_code(400);
        echo json_encode(["message" => "Invalid action"]);
        break;
}


// FUNCTION: LOGIN
function login() {
    $database = new Database();
    $db = $database->getConnection();

    $data = json_decode(file_get_contents("php://input"));
    $email = $data->email ?? '';
    $password = $data->password ?? '';

    $query = "SELECT u.*, t.name as tenant_name
              FROM users u
              JOIN tenants t ON u.tenant_id = t.id
              WHERE u.email = :email";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (password_verify($password, $row['password_hash'])) {
            $token = generateJWT([
                "user_id" => $row['id'],
                "tenant_id" => $row['tenant_id'],
                "email" => $row['email'],
                "role" => $row['role'],
                "name" => $row['name'],
                "avatar_url" => $row['avatar_url']
            ]);

            echo json_encode([
                "token" => $token,
                "user" => [
                    "id" => $row['id'],
                    "name" => $row['name'],
                    "email" => $row['email'],
                    "role" => $row['role'],
                    "tenant"=>[
                      "tenant_id" => $row['tenant_id'],
                      "tenant_name" => $row['tenant_name'],
                    ],
                    "avatar_url" => $row['avatar_url'],

                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Invalid credentials"]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["message" => "User not found"]);
    }
}

// FUNCTION: REGISTER
function register() {
    $database = new Database();
    $db = $database->getConnection();

    $data = json_decode(file_get_contents("php://input"));
    $email = $data->email;
    $password = password_hash($data->password, PASSWORD_DEFAULT);
    $name = $data->name;
    $tenant_id = $data->tenant_id;

    $query = "INSERT INTO users (tenant_id, email, password_hash, name)
              VALUES (:tenant_id, :email, :password, :name)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":tenant_id", $tenant_id);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password", $password);
    $stmt->bindParam(":name", $name);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "User registered successfully"]);
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Registration failed"]);
    }
}

// FUNCTION: REGISTER ADMIN
function registerAdmin($name, $email, $password, $tenant_id) {
    $database = new Database();
    $db = $database->getConnection();

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $query = "INSERT INTO users (name, email, password_hash, tenant_id, role)
              VALUES (:name, :email, :password_hash, :tenant_id, 'admin')";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password_hash', $hashedPassword);
    $stmt->bindParam(':tenant_id', $tenant_id);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Admin registered"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Failed to register admin"]);
    }
}

// FUNCTION: CREATE TENANT
function createTenant() {
    $database = new Database();
    $db = $database->getConnection();

    $name = $_POST['tenantName'] ?? null;
    $domain = $_POST['tenantDomain'] ?? null;

    if (!$name || !$domain) {
        http_response_code(400);
        echo json_encode(["message" => "Missing tenantName or tenantDomain"]);
        return;
    }

    // Check for duplicate domain
    $stmt = $db->prepare("SELECT id FROM tenants WHERE domain = :domain");
    $stmt->bindParam(":domain", $domain);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Domain already exists"]);
        return;
    }

    // File Upload
    $logo_url = null;
    if (isset($_FILES['logoFile']) && $_FILES['logoFile']['error'] === UPLOAD_ERR_OK) {
        $logo_url = fileUpload($_FILES['logoFile']);
    }

    // Insert tenant
    $stmt = $db->prepare("INSERT INTO tenants (name, domain, logo_url) VALUES (:name, :domain, :logo_url)");
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":domain", $domain);
    $stmt->bindParam(":logo_url", $logo_url);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "tenant_id" => $db->lastInsertId()]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to create tenant"]);
    }
}

// FUNCTION: FILE UPLOAD
function fileUpload($file) {
    // Validate file
    $allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
    ];
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPG, PNG, GIF, WebP and SVG images are allowed.');
    }

    // Check file size (5MB max)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('File too large. Maximum size is 5MB.');
    }

    $uploadDir = __DIR__ . '/../uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Sanitize filename and add unique identifier
    $originalName = basename($file['name']);
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $filename = uniqid('logo_') . '_' . preg_replace("/[^a-zA-Z0-9.]/", "_", $originalName);
    $targetFile = $uploadDir . $filename;

    // Check if file already exists
    if (file_exists($targetFile)) {
        $filename = uniqid('logo_') . '_' . time() . '.' . $extension;
        $targetFile = $uploadDir . $filename;
    }

    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        // Set proper permissions
        chmod($targetFile, 0644);

        // Return full URL path
        return 'https://humarksa.com/uploads/' . $filename;
    } else {
        throw new Exception('Failed to upload file.');
    }
}

// FUNCTION: LOGOUT
function logout() {
    session_destroy();
    echo json_encode(["message" => "Logged out successfully"]);
}
