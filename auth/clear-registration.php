<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (isset($_SESSION['register_data'])) {
    unset($_SESSION['register_data']);
}

echo 'cleared';
?>
