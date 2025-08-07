<?php
require_once 'config.php';

header('Content-Type: application/json');

$user_id = validate_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_response(['error' => 'Method not allowed'], 405);
}
if (isset($_POST['action']) && $_POST['action'] === 'uploadFiles') {
    uploadMultipleFiles($user_id);
    return;
}

$upload_type = $_POST['type'] ?? '';
$allowed_types = ['avatar', 'banner', 'server_icon', 'server_banner', 'attachment'];

if (!in_array($upload_type, $allowed_types)) {
    send_response(['error' => 'Invalid upload type'], 400);
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    send_response(['error' => 'No file uploaded or upload error'], 400);
}

$file = $_FILES['file'];
$file_size = $file['size'];
$file_name = $file['name'];
$file_tmp = $file['tmp_name'];
$file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
$max_size = 10 * 1024 * 1024; // 10MB
if ($file_size > $max_size) {
    send_response(['error' => 'File size too large (max 10MB)'], 400);
}
$allowed_extensions = [];
switch ($upload_type) {
    case 'avatar':
    case 'banner':
    case 'server_icon':
    case 'server_banner':
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        break;
    case 'attachment':
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'doc', 'docx', 'mp4', 'mp3', 'wav'];
        break;
}

if (!in_array($file_ext, $allowed_extensions)) {
    send_response(['error' => 'Invalid file type'], 400);
}
$upload_dir = "../uploads/" . $upload_type . "/";
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}
$unique_name = uniqid() . '_' . time() . '.' . $file_ext;
$upload_path = $upload_dir . $unique_name;
$public_url = "/user/user-server/uploads/" . $upload_type . "/" . $unique_name;

try {
    if (!move_uploaded_file($file_tmp, $upload_path)) {
        send_response(['error' => 'Failed to save file'], 500);
    }
    if (in_array($file_ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        processImage($upload_path, $upload_type);
    }
    if ($upload_type === 'avatar' || $upload_type === 'banner') {
        updateUserProfile($user_id, $upload_type, $public_url);
    }
    logUpload($user_id, $upload_type, $unique_name, $file_name, $file_size, $public_url);
    
    send_response([
        'success' => true,
        'message' => 'File uploaded successfully',
        'url' => $public_url,
        'filename' => $unique_name,
        'originalName' => $file_name,
        'size' => $file_size
    ]);
    
} catch (Exception $e) {
    error_log("Upload error: " . $e->getMessage());
    send_response(['error' => 'Upload failed'], 500);
}

function uploadMultipleFiles($user_id) {
    if (!isset($_FILES['files']) || empty($_FILES['files']['name'])) {
        send_response(['error' => 'No files uploaded'], 400);
        return;
    }

    $files = $_FILES['files'];
    $uploadedFiles = [];
    $uploadDir = '../uploads/attachments/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $maxSize = 10 * 1024 * 1024;
    $allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/mov',
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg',
        'text/plain', 'application/pdf',
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    $fileCount = is_array($files['name']) ? count($files['name']) : 1;
    
    for ($i = 0; $i < $fileCount; $i++) {
        $fileName = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $fileTmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $fileSize = is_array($files['size']) ? $files['size'][$i] : $files['size'];
        $fileError = is_array($files['error']) ? $files['error'][$i] : $files['error'];
        $fileType = is_array($files['type']) ? $files['type'][$i] : $files['type'];
        if ($fileError !== UPLOAD_ERR_OK) {
            send_response(['error' => "Upload error for file: $fileName"], 400);
            return;
        }
        if ($fileSize > $maxSize) {
            send_response(['error' => "File $fileName is too large. Maximum size is 10MB."], 400);
            return;
        }
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $fileTmpName);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedTypes)) {
            send_response(['error' => "File type not allowed for: $fileName"], 400);
            return;
        }
        $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
        $safeFileName = sanitize_filename(pathinfo($fileName, PATHINFO_FILENAME));
        $uniqueFileName = $safeFileName . '_' . time() . '_' . uniqid() . '.' . $fileExtension;
        
        $uploadPath = $uploadDir . $uniqueFileName;
        if (move_uploaded_file($fileTmpName, $uploadPath)) {
            $fileUrl = '/user/user-server/uploads/attachments/' . $uniqueFileName;
            try {
                global $mysqli;
                $mysqli->query("
                    CREATE TABLE IF NOT EXISTS UploadedFiles (
                        ID INTEGER(10) PRIMARY KEY AUTO_INCREMENT,
                        UserID INTEGER(10) NOT NULL,
                        FileName VARCHAR(255) NOT NULL,
                        FilePath VARCHAR(500) NOT NULL,
                        FileSize INTEGER(10) NOT NULL,
                        MimeType VARCHAR(100) NOT NULL,
                        UploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
                    )
                ");
                
                $stmt = $mysqli->prepare("
                    INSERT INTO UploadedFiles (UserID, FileName, FilePath, FileSize, MimeType) 
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->bind_param("issis", $user_id, $fileName, $fileUrl, $fileSize, $mimeType);
                $stmt->execute();
            } catch (Exception $e) {
                error_log("Error storing file info: " . $e->getMessage());
            }
            
            $uploadedFiles[] = [
                'url' => $fileUrl,
                'name' => $fileName,
                'size' => $fileSize,
                'type' => $mimeType
            ];
        } else {
            send_response(['error' => "Failed to upload file: $fileName"], 500);
            return;
        }
    }

    send_response([
        'success' => true,
        'fileUrls' => array_column($uploadedFiles, 'url'),
        'files' => $uploadedFiles
    ]);
}

function sanitize_filename($filename) {
    $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename);
    $filename = preg_replace('/_+/', '_', $filename);
    return trim($filename, '_');
}

function processImage($file_path, $upload_type) {
    $image_info = getimagesize($file_path);
    if (!$image_info) {
        return; // Not a valid image
    }
    
    $width = $image_info[0];
    $height = $image_info[1];
    $mime_type = $image_info['mime'];
    $max_dimensions = [
        'avatar' => ['width' => 512, 'height' => 512],
        'banner' => ['width' => 1920, 'height' => 480],
        'server_icon' => ['width' => 512, 'height' => 512],
        'server_banner' => ['width' => 1920, 'height' => 480],
        'attachment' => ['width' => 1920, 'height' => 1080]
    ];
    
    $max_width = $max_dimensions[$upload_type]['width'];
    $max_height = $max_dimensions[$upload_type]['height'];
    if ($width <= $max_width && $height <= $max_height) {
        return; // No resizing needed
    }
    $ratio = min($max_width / $width, $max_height / $height);
    $new_width = round($width * $ratio);
    $new_height = round($height * $ratio);
    $source = null;
    switch ($mime_type) {
        case 'image/jpeg':
            $source = imagecreatefromjpeg($file_path);
            break;
        case 'image/png':
            $source = imagecreatefrompng($file_path);
            break;
        case 'image/gif':
            $source = imagecreatefromgif($file_path);
            break;
        case 'image/webp':
            $source = imagecreatefromwebp($file_path);
            break;
        default:
            return; // Unsupported format
    }
    
    if (!$source) {
        return;
    }
    $resized = imagecreatetruecolor($new_width, $new_height);
    if ($mime_type === 'image/png' || $mime_type === 'image/gif') {
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
        imagefilledrectangle($resized, 0, 0, $new_width, $new_height, $transparent);
    }
    imagecopyresampled($resized, $source, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
    switch ($mime_type) {
        case 'image/jpeg':
            imagejpeg($resized, $file_path, 85);
            break;
        case 'image/png':
            imagepng($resized, $file_path, 6);
            break;
        case 'image/gif':
            imagegif($resized, $file_path);
            break;
        case 'image/webp':
            imagewebp($resized, $file_path, 85);
            break;
    }
    imagedestroy($source);
    imagedestroy($resized);
}

function logUpload($user_id, $upload_type, $filename, $original_name, $file_size, $public_url) {
    global $mysqli;
    
    try {
        $mysqli->query("
            CREATE TABLE IF NOT EXISTS Uploads (
                ID INTEGER(10) PRIMARY KEY AUTO_INCREMENT,
                UserID INTEGER(10) NOT NULL,
                Type VARCHAR(50) NOT NULL,
                Filename VARCHAR(255) NOT NULL,
                OriginalName VARCHAR(255) NOT NULL,
                FileSize INTEGER(10) NOT NULL,
                PublicUrl VARCHAR(500) NOT NULL,
                UploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
            )
        ");
        
        $stmt = $mysqli->prepare("
            INSERT INTO Uploads (UserID, Type, Filename, OriginalName, FileSize, PublicUrl) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("isssis", $user_id, $upload_type, $filename, $original_name, $file_size, $public_url);
        $stmt->execute();
    } catch (Exception $e) {
        error_log("Error logging upload: " . $e->getMessage());
    }
}

function updateUserProfile($user_id, $upload_type, $public_url) {
    global $mysqli;
    
    try {
        if ($upload_type === 'avatar') {
            $stmt = $mysqli->prepare("UPDATE Users SET ProfilePictureUrl = ? WHERE ID = ?");
        } elseif ($upload_type === 'banner') {
            $stmt = $mysqli->prepare("UPDATE Users SET BannerProfile = ? WHERE ID = ?");
        } else {
            return; // Not a profile-related upload
        }
        
        $stmt->bind_param("si", $public_url, $user_id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            error_log("Updated user profile: $upload_type for user $user_id");
        }
    } catch (Exception $e) {
        error_log("Error updating user profile: " . $e->getMessage());
        throw $e; // Re-throw to handle in calling function
    }
}
?>