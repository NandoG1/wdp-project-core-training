<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Database configuration
$host = "localhost";
$username = "root";
$password = "";
$database = "misvord";

$mysqli = new mysqli($host, $username, $password, $database, 3307);

if ($mysqli->connect_error) {
    if (!headers_sent()) {
        header('Content-Type: application/json');
        http_response_code(500);
    }
    echo json_encode(['error' => 'Database connection failed: ' . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset("utf8mb4");

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function sanitize_input($data) {
    global $mysqli;
    return $mysqli->real_escape_string(trim($data));
}

function send_response($data, $status_code = 200) {
    if (!headers_sent()) {
        http_response_code($status_code);
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
    echo json_encode($data);
    exit;
}

function validate_session() {
    try {
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            session_start();
        }
        
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['user_id'])) {
            return $_SESSION['user_id'];
        }
        
        send_response(['error' => 'Unauthorized - Please log in'], 401);
        
    } catch (Exception $e) {
        error_log("Session validation error: " . $e->getMessage());
        send_response(['error' => 'Session error: ' . $e->getMessage()], 500);
    }
}

function get_user_by_id($user_id) {
    global $mysqli;
    $stmt = $mysqli->prepare("SELECT ID, Username, Email, ProfilePictureUrl, Status, DisplayName, Discriminator FROM Users WHERE ID = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

function format_timestamp($timestamp) {
    return date('Y-m-d H:i:s', strtotime($timestamp));
}
?>