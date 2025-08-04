<?php
function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, 'your-secret-key', true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function validateJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }

    $signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], 'your-secret-key', true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    if ($base64UrlSignature !== $parts[2]) {
        return false;
    }

    return json_decode(base64_decode($parts[1]), true);
}

function getAuthUser() {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        return null;
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);
    return validateJWT($token);
}
