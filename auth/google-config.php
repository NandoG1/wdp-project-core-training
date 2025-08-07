<?php
define('GOOGLE_CLIENT_ID', '32');
define('GOOGLE_CLIENT_SECRET', 'G');
define('GOOGLE_REDIRECT_URI', 'http://localhost:8010/auth/google-callback.php');
define('SITE_URL', 'http://localhost:8010/auth');
define('SITE_NAME', 'Auth System');
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_lifetime', 86400); // 24 hours
    session_start();
}
?>