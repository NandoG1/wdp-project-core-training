<?php
/**
 * Simple PHP Development Server for Discord Clone
 * 
 * This script provides a simple way to serve the Discord Clone application
 * using PHP's built-in server with SQLite database support.
 * 
 * Usage: php server.php [port]
 * Default port: 8000
 */

// Set the default port
$port = isset($argv[1]) ? (int)$argv[1] : 8000;

// Check if port is valid
if ($port < 1024 || $port > 65535) {
    echo "Error: Port must be between 1024 and 65535\n";
    exit(1);
}

// Set the document root to current directory
$docRoot = __DIR__;

// Display startup information
echo "===========================================\n";
echo "  Discord Clone - Server Explorer\n";
echo "===========================================\n";
echo "Starting PHP development server...\n";
echo "Document Root: $docRoot\n";
echo "Port: $port\n";
echo "URL: http://localhost:$port/user-explore.php\n";
echo "===========================================\n";
echo "Features included:\n";
echo "✓ Server Discovery with Categories\n";
echo "✓ Search and Sort Functionality\n";
echo "✓ Infinite Scroll\n";
echo "✓ Server Details Modal\n";
echo "✓ Join Server Functionality\n";
echo "✓ SQLite Database (auto-created)\n";
echo "✓ Sample Data Included\n";
echo "===========================================\n";
echo "Press Ctrl+C to stop the server\n";
echo "===========================================\n\n";

// Change to the document root
chdir($docRoot);

// Start the PHP built-in server
$command = sprintf(
    'php -S localhost:%d -t %s',
    $port,
    escapeshellarg($docRoot)
);

// Execute the server command
echo "Server starting...\n";
echo "You can now open: http://localhost:$port/user-explore.php\n\n";

// Execute the command
passthru($command);
?>