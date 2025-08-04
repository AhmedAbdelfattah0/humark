<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
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
        $post_id = isset($_GET['post_id']) ? $_GET['post_id'] : null;
        if (!$post_id) {
            http_response_code(400);
            echo json_encode(["message" => "Post ID is required"]);
            exit;
        }

        $query = "SELECT r.*, u.name as author_name
                 FROM replies r
                 JOIN users u ON r.user_id = u.id
                 JOIN posts p ON r.post_id = p.id
                 WHERE p.tenant_id = :tenant_id AND r.post_id = :post_id
                 ORDER BY r.created_at ASC";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":tenant_id", $user['tenant_id']);
        $stmt->bindParam(":post_id", $post_id);
        $stmt->execute();

        $replies = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $replies[] = $row;
        }

        http_response_code(200);
        echo json_encode($replies);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        $query = "INSERT INTO replies (post_id, user_id, content)
                 VALUES (:post_id, :user_id, :content)";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":post_id", $data->post_id);
        $stmt->bindParam(":user_id", $user['user_id']);
        $stmt->bindParam(":content", $data->content);

        if($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Reply created successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Reply creation failed"]);
        }
        break;
}
