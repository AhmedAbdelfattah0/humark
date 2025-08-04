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
    $stats = [];

    // Total posts
    $query = "SELECT COUNT(*) as total_posts
             FROM posts
             WHERE tenant_id = :tenant_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":tenant_id", $user['tenant_id']);
    $stmt->execute();
    $stats['total_posts'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_posts'];

    // Total replies
    $query = "SELECT COUNT(*) as total_replies
             FROM replies r
             JOIN posts p ON r.post_id = p.id
             WHERE p.tenant_id = :tenant_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":tenant_id", $user['tenant_id']);
    $stmt->execute();
    $stats['total_replies'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_replies'];

    // Total users
    $query = "SELECT COUNT(*) as total_users
             FROM users
             WHERE tenant_id = :tenant_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":tenant_id", $user['tenant_id']);
    $stmt->execute();
    $stats['total_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_users'];

    // Posts by category
    $query = "SELECT c.name, COUNT(p.id) as count
             FROM categories c
             LEFT JOIN posts p ON c.id = p.category_id
             WHERE c.tenant_id = :tenant_id
             GROUP BY c.id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":tenant_id", $user['tenant_id']);
    $stmt->execute();
    $stats['posts_by_category'] = [];
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $stats['posts_by_category'][] = $row;
    }

    // Recent activity
    $query = "(
                SELECT 'post' as type, p.id, p.title, p.created_at, u.name as author_name
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.tenant_id = :tenant_id
                ORDER BY p.created_at DESC
                LIMIT 5
             ) UNION ALL (
                SELECT 'reply' as type, r.id, p.title, r.created_at, u.name as author_name
                FROM replies r
                JOIN posts p ON r.post_id = p.id
                JOIN users u ON r.user_id = u.id
                WHERE p.tenant_id = :tenant_id
                ORDER BY r.created_at DESC
                LIMIT 5
             )
             ORDER BY created_at DESC
             LIMIT 10";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":tenant_id", $user['tenant_id']);
    $stmt->execute();
    $stats['recent_activity'] = [];
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $stats['recent_activity'][] = $row;
    }

    http_response_code(200);
    echo json_encode($stats);
}
