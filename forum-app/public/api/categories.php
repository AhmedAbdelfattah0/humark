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
        $query = "SELECT * FROM categories WHERE tenant_id = :tenant_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":tenant_id", $user['tenant_id']);
        $stmt->execute();

        $categories = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $categories[] = $row;
        }

        http_response_code(200);
        echo json_encode($categories);
        break;

    case 'POST':
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Only admins can create categories"]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));

        $query = "INSERT INTO categories (tenant_id, name, description)
                 VALUES (:tenant_id, :name, :description)";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":tenant_id", $user['tenant_id']);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":description", $data->description);

        if($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Category created successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Category creation failed"]);
        }
        break;
}
