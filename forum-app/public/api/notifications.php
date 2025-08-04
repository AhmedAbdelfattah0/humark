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
        $query = "SELECT * FROM notifications
                 WHERE user_id = :user_id
                 ORDER BY created_at DESC
                 LIMIT 50";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user['user_id']);
        $stmt->execute();

        $notifications = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $notifications[] = $row;
        }

        http_response_code(200);
        echo json_encode($notifications);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));

        if (isset($data->notification_id)) {
            $query = "UPDATE notifications
                     SET is_read = 1
                     WHERE id = :notification_id AND user_id = :user_id";

            $stmt = $db->prepare($query);
            $stmt->bindParam(":notification_id", $data->notification_id);
            $stmt->bindParam(":user_id", $user['user_id']);

            if($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Notification marked as read"]);
            } else {
                http_response_code(400);
                echo json_encode(["message" => "Failed to update notification"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Notification ID is required"]);
        }
        break;
}
