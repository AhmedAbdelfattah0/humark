<?php
// CORS HEADERS
if (isset($_SERVER['HTTP_ORIGIN'])) {
  header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
  header("Access-Control-Allow-Credentials: true");
  header("Access-Control-Max-Age: 86400"); // 1 day
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
  }

  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
    header("Access-Control-Allow-Headers: " . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
  }

  http_response_code(200);
  exit();
}

header("Content-Type: application/json; charset=UTF-8");

// INCLUDES
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/jwt.php';

// ERROR REPORTING
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// DB CONNECTION
$database = new Database();
$db = $database->getConnection();

// AUTHENTICATION
$user = getAuthUser(); // Decode JWT and return user info
if (!$user) {
  http_response_code(401);
  echo json_encode(["message" => "Unauthorized"]);
  exit;
}

// ROUTING
$action = $_GET['action'] ?? null;
$postId = $_GET['id'] ?? null;
switch ($action) {
  case 'getPosts':
    handleGet($db, $user);
    break;
  case 'createPost':
    handlePost($db, $user);
    break;
  case 'getPostById':
    handleGetPostById($db, $user, $postId);
    break;
  case 'updatePost':
    handleUpdatePost($db, $user, $postId);
    break;
  default:
    http_response_code(400);
    echo json_encode(["message" => "Invalid action"]);
    break;
}

// GET HANDLER
function handleGet($db, $user)
{
  try {
    error_log("Tenant ID from JWT: " . $user['tenant']['tenant_id']);

    // Get posts
    $query = "SELECT p.*, u.name as author_name, u.avatar_url as author_avatar
                  FROM posts p
                  JOIN users u ON p.user_id = u.id
                  WHERE p.tenant_id = :tenant_id
                  ORDER BY p.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":tenant_id", $user['tenant']['tenant_id']);
    $stmt->execute();

    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // For each post, fetch its files
    foreach ($posts as &$post) {
      $fileQuery = "SELECT id, file_name, file_path as url, file_type as type, file_size, created_at
                          FROM files
                          WHERE post_id = :post_id";

      $fileStmt = $db->prepare($fileQuery);
      $fileStmt->bindParam(":post_id", $post['id']);
      $fileStmt->execute();
      $post['files'] = $fileStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    http_response_code(200);
    echo json_encode(['posts' => $posts]);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error", "error" => $e->getMessage()]);
  }
}


// POST HANDLER
function handlePost($db, $user)
{
  try {
    $data = json_decode(file_get_contents("php://input"));

    if (!$data && !empty($_POST)) {
      $data = (object)$_POST;
    }

    if (empty($data->content)) {
      http_response_code(400);
      echo json_encode(["message" => "Missing required fields"]);
      return;
    }

    $tenant_id = $user['tenant']['tenant_id'];
    $user_id = $user['user_id'];
    $content = $data->content;

    // Insert into posts
    $query = "INSERT INTO posts (tenant_id, user_id, content, created_at)
                  VALUES (:tenant_id, :user_id, :content, NOW())";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":tenant_id", $tenant_id);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->bindParam(":content", $content);

    if ($stmt->execute()) {
      $post_id = $db->lastInsertId();
      $fileUrls = [];

      // Handle file_urls if provided
      if (!empty($data->file_urls) && is_array($data->file_urls)) {
        $fileInsert = $db->prepare("
                    INSERT INTO files
                    (tenant_id, post_id, user_id, file_name, file_path, file_type, file_size, created_at)
                    VALUES
                    (:tenant_id, :post_id, :user_id, :file_name, :file_path, :file_type, :file_size, NOW())
                ");

        foreach ($data->file_urls as $fileUrl) {
          // Extract filename and extension from the URL
          $fileName = basename($fileUrl);
          $fileExt = pathinfo($fileName, PATHINFO_EXTENSION);
          $fileType = '';

          // Map extensions to mime types
          switch (strtolower($fileExt)) {
            case 'jpg':
            case 'jpeg':
              $fileType = 'image/jpeg';
              break;
            case 'png':
              $fileType = 'image/png';
              break;
            case 'gif':
              $fileType = 'image/gif';
              break;
            case 'pdf':
              $fileType = 'application/pdf';
              break;
            case 'doc':
              $fileType = 'application/msword';
              break;
            case 'docx':
              $fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              break;
            default:
              $fileType = 'application/octet-stream';
          }

          // Try to get file size
          $fileSize = 0;
          if (file_exists($fileUrl)) {
            $fileSize = filesize($fileUrl);
          }

          $fileInsert->execute([
            ":tenant_id" => $tenant_id,
            ":post_id" => $post_id,
            ":user_id" => $user_id,
            ":file_name" => $fileName,
            ":file_path" => $fileUrl,
            ":file_type" => $fileType,
            ":file_size" => $fileSize
          ]);

          $fileUrls[] = $fileUrl;
        }
      }

      http_response_code(201);
      echo json_encode([
        "message" => "Post created successfully",
        "post_id" => $post_id,
        "file_urls" => $fileUrls
      ]);
    } else {
      http_response_code(500);
      echo json_encode(["message" => "Failed to create post"]);
    }
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error", "error" => $e->getMessage()]);
  }
}

function handleUpdatePost($db, $user, $postId)
{
  try {
    $data = json_decode(file_get_contents("php://input"));

    if (!$data && !empty($_POST)) {
      $data = (object)$_POST;
    }

    if (empty($data->content)) {
      http_response_code(400);
      echo json_encode(["message" => "Missing required fields"]);
      return;
    }

    $tenant_id = $user['tenant']['tenant_id'];
    $user_id = $user['user_id'];
    $content = $data->content;

    // Update post
    $query = "UPDATE posts SET content = :content WHERE id = :postId AND tenant_id = :tenant_id AND user_id = :user_id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":content", $content);
    $stmt->bindParam(":postId", $postId);
    $stmt->bindParam(":tenant_id", $tenant_id);
    $stmt->bindParam(":user_id", $user_id);

    // Handle file_urls if provided
    if (!empty($data->file_urls) && is_array($data->file_urls)) {
      // Delete existing files for this post
      $deleteQuery = "DELETE FROM files WHERE post_id = :postId";
      $deleteStmt = $db->prepare($deleteQuery);
      $deleteStmt->bindParam(":postId", $postId);
      $deleteStmt->execute();

      // Insert new files
      $insertQuery = "INSERT INTO files (tenant_id, post_id, user_id, file_name, file_path, file_type, file_size, created_at)
                      VALUES (:tenant_id, :post_id, :user_id, :file_name, :file_path, :file_type, :file_size, NOW())";

      $insertStmt = $db->prepare($insertQuery);

      foreach ($data->file_urls as $fileUrl) {
        // Extract filename and extension from the URL
        $fileName = basename($fileUrl);
        $fileExt = pathinfo($fileName, PATHINFO_EXTENSION);
        $fileType = '';

        // Map extensions to mime types
        switch (strtolower($fileExt)) {
          case 'jpg':
            $fileType = 'image/jpeg';
            break;
          case 'png':
            $fileType = 'image/png';
            break;
          case 'gif':
            $fileType = 'image/gif';
            break;
          case 'pdf':
            $fileType = 'application/pdf';
            break;
          case 'doc':
            $fileType = 'application/msword';
            break;
          case 'docx':
            $fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          default:
            $fileType = 'application/octet-stream';
        }

        // Try to get file size
        $fileSize = 0;
        if (file_exists($fileUrl)) {
          $fileSize = filesize($fileUrl);
        }

        $insertStmt->execute([
          ":tenant_id" => $tenant_id,
          ":post_id" => $postId,
          ":user_id" => $user_id,
          ":file_name" => $fileName,
          ":file_path" => $fileUrl,
          ":file_type" => $fileType,
          ":file_size" => $fileSize
        ]);
      }
    }
    if ($stmt->execute()) {
      http_response_code(200);
      echo json_encode(["message" => "Post updated successfully"]);
    } else {
      http_response_code(500);
      echo json_encode(["message" => "Failed to update post"]);
    }
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error", "error" => $e->getMessage()]);
  }
}



function handleGetPostById($db, $user, $postId)
{
  if (!$postId) {
    http_response_code(400);
    echo json_encode(["message" => "Missing post_id"]);
    return;
  }
  $query = "SELECT p.*, u.name as author_name, u.avatar_url as author_avatar
              FROM posts p
              JOIN users u ON p.user_id = u.id
                WHERE p.id = :postId";



  $stmt = $db->prepare($query);
  $stmt->bindParam(":postId", $postId);
  $stmt->execute();

  $post = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$post) {
    http_response_code(404);
    echo json_encode(["message" => "Post not found"]);
    return;
  }


  // Second, get files for this post
  $fileQuery = "SELECT id, file_name, file_type, file_path as url FROM files WHERE post_id = :postId";
  $fileStmt = $db->prepare($fileQuery);
  $fileStmt->bindParam(":postId", $postId);
  $fileStmt->execute();
  $files = $fileStmt->fetchAll(PDO::FETCH_ASSOC);

  // Add files to post data
  $post['files'] = $files;


  http_response_code(200);
  echo json_encode(["post" => $post]);
}

// FUNCTION: FILE UPLOAD
function fileUpload($file)
{
  // Validate file
  $allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!in_array($file['type'], $allowedTypes)) {
    throw new Exception('Invalid file type. Only images, PDF, DOC and DOCX files are allowed.');
  }

  // Check file size (10MB max)
  if ($file['size'] > 10 * 1024 * 1024) {
    throw new Exception('File too large. Maximum size is 10MB.');
  }

  $uploadDir = __DIR__ . '/../uploads/';
  if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
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

  if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    // Set proper permissions
    chmod($targetFile, 0644);

    // Return full URL path
    return 'https://humarksa.com/uploads/' . $filename;
  } else {
    throw new Exception('Failed to upload file.');
  }
}
