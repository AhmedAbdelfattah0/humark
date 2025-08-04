<?php
// CORS HEADERS - must be set before any output
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400"); // 1 day
} else {
    header("Access-Control-Allow-Origin: *");
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    }

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: " . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
    } else {
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    }

    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

// INCLUDES
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/jwt.php';

// Increase upload size limits if needed (without modifying php.ini)
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');

// ERROR REPORTING
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$database = new Database();
$db = $database->getConnection();

$user = getAuthUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit;
}

$action = $_GET['action'] ?? 'upload';

switch($action) {
    case 'upload':
        handleFileUpload($_FILES, $user, $db);
        break;
    default:
        http_response_code(400);
        echo json_encode(["message" => "Invalid action"]);
        break;
}

function handleFileUpload($files, $user, $db) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Debug information
        error_log('$_FILES content: ' . print_r($_FILES, true));
        error_log('Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));

        // Check if files were uploaded
        if (empty($_FILES)) {
            http_response_code(400);
            echo json_encode([
                "message" => "No files uploaded",
                "debug" => [
                    "files_count" => count($_FILES),
                    "content_type" => $_SERVER['CONTENT_TYPE'] ?? 'not set',
                    "method" => $_SERVER['REQUEST_METHOD'],
                    "request_size" => $_SERVER['CONTENT_LENGTH'] ?? 'unknown'
                ]
            ]);
            exit;
        }

        try {
            // Handle both single and multiple file uploads
            $responseData = [];

            // Process files - a unified approach to handle all types of uploads
            foreach ($_FILES as $fieldName => $fileData) {
                // Check if this is a simple file field (single file)
                if (!is_array($fileData['name'])) {
                    if ($fileData['error'] === UPLOAD_ERR_OK) {
                        $fileUrl = fileUpload($fileData);
                        $fileInfo = saveFileToDatabase($fileData, $fileUrl, $user, $db);
                        if ($fileInfo) {
                            $responseData[] = $fileInfo;
                        }
                    }
                }
                // Check if this is a multiple file upload
                else if (is_array($fileData['name'])) {
                    $fileCount = count($fileData['name']);

                    for ($i = 0; $i < $fileCount; $i++) {
                        if ($fileData['error'][$i] === UPLOAD_ERR_OK) {
                            $singleFile = [
                                'name' => $fileData['name'][$i],
                                'type' => $fileData['type'][$i],
                                'tmp_name' => $fileData['tmp_name'][$i],
                                'error' => $fileData['error'][$i],
                                'size' => $fileData['size'][$i]
                            ];

                            $fileUrl = fileUpload($singleFile);
                            $fileInfo = saveFileToDatabase($singleFile, $fileUrl, $user, $db);
                            if ($fileInfo) {
                                $responseData[] = $fileInfo;
                            }
                        }
                    }
                }
            }

            if (empty($responseData)) {
                http_response_code(400);
                echo json_encode(["message" => "No valid files were uploaded"]);
            } else {
                http_response_code(201);
                echo json_encode([
                    "message" => "Files uploaded successfully",
                    "files" => $responseData
                ]);
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                "message" => $e->getMessage(),
                "debug" => [
                    "files" => array_keys($_FILES)
                ]
            ]);
        }
    }
}

/**
 * Save file information to database
 */
function saveFileToDatabase($file, $fileUrl, $user, $db) {
    $query = "INSERT INTO files (tenant_id, user_id, file_name, file_path, file_type, file_size)
             VALUES (:tenant_id, :user_id, :file_name, :file_path, :file_type, :file_size)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":tenant_id", $user['tenant']['tenant_id']);
    $stmt->bindParam(":user_id", $user['user_id']);
    $stmt->bindParam(":file_name", $file['name']);
    $stmt->bindParam(":file_path", $fileUrl);
    $stmt->bindParam(":file_type", $file['type']);
    $stmt->bindParam(":file_size", $file['size']);

    if($stmt->execute()) {
        return [
            "id" => $db->lastInsertId(),
            "path" => $fileUrl,
            "name" => $file['name'],
            "type" => $file['type'],
            "size" => $file['size']
        ];
    }

    return null;
}

/**
 * Handle a single file upload
 */
function fileUpload($file) {
    // Debug file data
    error_log("File upload attempt: " . json_encode($file));

    // Validate file
    $allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    // Check if file exists and has required fields
    if (!isset($file['tmp_name']) || !isset($file['name']) || !isset($file['type']) || !isset($file['size'])) {
        throw new Exception('Invalid file data provided');
    }

    // Check if file was uploaded
    if (!is_uploaded_file($file['tmp_name'])) {
        throw new Exception('File was not uploaded via HTTP POST');
    }

    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only images, PDF, DOC and DOCX files are allowed.');
    }

    // Check file size (10MB max)
    if ($file['size'] > 10 * 1024 * 1024) {
        throw new Exception('File too large. Maximum size is 10MB.');
    }

    $uploadDir = __DIR__ . '/../uploads/';
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception('Failed to create upload directory');
        }
    }

    // Ensure upload directory is writable
    if (!is_writable($uploadDir)) {
        throw new Exception('Upload directory is not writable');
    }

    // Sanitize filename and add unique identifier
    $originalName = basename($file['name']);
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $filename = uniqid('file_') . '_' . preg_replace("/[^a-zA-Z0-9.]/", "_", $originalName);
    $targetFile = $uploadDir . $filename;

    // Check if file already exists
    if (file_exists($targetFile)) {
        $filename = uniqid('file_') . '_' . time() . '.' . $extension;
        $targetFile = $uploadDir . $filename;
    }

    // Debug upload path
    error_log("Attempting to move file to: " . $targetFile);

    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        // Set proper permissions
        chmod($targetFile, 0644);

        // Return relative URL path that can be properly accessed
        $baseUrl = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
        $baseUrl .= $_SERVER['HTTP_HOST'];
        return $baseUrl . '/uploads/' . $filename;
    } else {
        error_log("Failed to move uploaded file: " . error_get_last()['message']);
        throw new Exception('Failed to upload file. Please check server permissions.');
    }
}
