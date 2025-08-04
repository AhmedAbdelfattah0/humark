<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $search_term = isset($_GET['q']) ? $_GET['q'] : '';
    $type = isset($_GET['type']) ? $_GET['type'] : 'all';

    if (empty($search_term)) {
        http_response_code(400);
        echo json_encode(["message" => "Search term is required"]);
        exit;
    }

    $search_term = "%$search_term%";
    $results = [];

    if ($type === 'all' || $type === 'posts') {
        $query = "SELECT p.*, u.name as author_name, c.name as category_name
                 FROM posts p
                 JOIN users u ON p.user_id = u.id
                 JOIN categories c ON p.category_id = c.id
                 WHERE p.tenant_id = :tenant_id
                 AND (p.title LIKE :search OR p.content LIKE :search)
                 ORDER BY p.created_at DESC";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":tenant_id", $user['tenant_id']);
        $stmt->bindParam(":search", $search_term);
        $stmt->execute();

        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['type'] = 'post';
            $results[] = $row;
        }
    }

    if ($type === 'all' || $type === 'replies') {
        $query = "SELECT r.*, u.name as author_name, p.title as post_title
                 FROM replies r
                 JOIN users u ON r.user_id = u.id
                 JOIN posts p ON r.post_id = p.id
                 WHERE p.tenant_id = :tenant_id
                 AND r.content LIKE :search
                 ORDER BY r.created_at DESC";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":tenant_id", $user['tenant_id']);
        $stmt->bindParam(":search", $search_term);
        $stmt->execute();

        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['type'] = 'reply';
            $results[] = $row;
        }
    }

    http_response_code(200);
    echo json_encode($results);
}
