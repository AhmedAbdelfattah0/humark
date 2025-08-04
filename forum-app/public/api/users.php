<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'config/database.php';
include_once 'config/jwt.php';

$database = new Database();
$db = $database->getConnection();

$user = getAuthUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit;
}

switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Only admins can view users"]);
            exit;
        }

        $query = "SELECT id, name, email, role, status, created_at, last_login
                 FROM users
                 WHERE tenant_id = :tenant_id
                 ORDER BY created_at DESC";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":tenant_id", $user['tenant_id']);
        $stmt->execute();

        $users = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = $row;
        }

        http_response_code(200);
        echo json_encode($users);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));

        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Only admins can update users"]);
            exit;
        }

        $query = "UPDATE users
                 SET role = :role, status = :status
                 WHERE id = :user_id AND tenant_id = :tenant_id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":role", $data->role);
        $stmt->bindParam(":status", $data->status);
        $stmt->bindParam(":user_id", $data->user_id);
        $stmt->bindParam(":tenant_id", $user['tenant_id']);

        if($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "User updated successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "User update failed"]);
        }
        break;

    case 'DELETE':
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Only admins can delete users"]);
            exit;
        }

        $user_id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$user_id) {
            http_response_code(400);
            echo json_encode(["message" => "User ID is required"]);
            exit;
        }

        $query = "DELETE FROM users
                 WHERE id = :user_id AND tenant_id = :tenant_id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":tenant_id", $user['tenant_id']);

        if($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "User deleted successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "User deletion failed"]);
        }
        break;
}
