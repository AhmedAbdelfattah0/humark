<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, PUT");
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
        $query = "SELECT id, name, email, role, avatar_url, created_at, last_login
                 FROM users
                 WHERE id = :user_id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user['user_id']);
        $stmt->execute();

        if($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(200);
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "User not found"]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));

        $query = "UPDATE users
                 SET name = :name, avatar_url = :avatar_url
                 WHERE id = :user_id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":avatar_url", $data->avatar_url);
        $stmt->bindParam(":user_id", $user['user_id']);

        if($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Profile updated successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Profile update failed"]);
        }
        break;
}
