<?php
require_once 'config.php';

// Demo data setup for testing
$demo_users = [
    [
        'id' => 1,
        'username' => 'demo_user',
        'email' => 'demo@example.com',
        'password' => password_hash('demo123', PASSWORD_DEFAULT),
        'display_name' => 'Demo User',
        'discriminator' => '0001',
        'status' => 'online'
    ],
    [
        'id' => 2,
        'username' => 'alice',
        'email' => 'alice@example.com',
        'password' => password_hash('demo123', PASSWORD_DEFAULT),
        'display_name' => 'Alice Smith',
        'discriminator' => '0002',
        'status' => 'online'
    ],
    [
        'id' => 3,
        'username' => 'bob',
        'email' => 'bob@example.com',
        'password' => password_hash('demo123', PASSWORD_DEFAULT),
        'display_name' => 'Bob Johnson',
        'discriminator' => '0003',
        'status' => 'away'
    ]
];

// Insert demo users if they don't exist
foreach ($demo_users as $user) {
    $check_query = "SELECT ID FROM Users WHERE ID = ?";
    $stmt = $mysqli->prepare($check_query);
    $stmt->bind_param("i", $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $insert_query = "INSERT INTO Users (ID, Username, Email, Password, DisplayName, Discriminator, Status) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $mysqli->prepare($insert_query);
        $stmt->bind_param("issssss", 
            $user['id'], 
            $user['username'], 
            $user['email'], 
            $user['password'], 
            $user['display_name'], 
            $user['discriminator'],
            $user['status']
        );
        $stmt->execute();
        echo "Created user: " . $user['username'] . "\n";
    }
}

// Create friendships between demo users
$friendships = [
    [1, 2, 'accepted'], // demo_user and alice are friends
    [1, 3, 'accepted']  // demo_user and bob are friends
];

foreach ($friendships as $friendship) {
    $check_query = "SELECT ID FROM FriendsList WHERE 
                    ((UserID1 = ? AND UserID2 = ?) OR (UserID1 = ? AND UserID2 = ?))";
    $stmt = $mysqli->prepare($check_query);
    $stmt->bind_param("iiii", $friendship[0], $friendship[1], $friendship[1], $friendship[0]);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $insert_query = "INSERT INTO FriendsList (UserID1, UserID2, Status) VALUES (?, ?, ?)";
        $stmt = $mysqli->prepare($insert_query);
        $stmt->bind_param("iis", $friendship[0], $friendship[1], $friendship[2]);
        $stmt->execute();
        echo "Created friendship between users " . $friendship[0] . " and " . $friendship[1] . "\n";
    }
}

echo "Demo data setup complete!\n";
echo "You can now test the application with these users:\n";
echo "- demo_user#0001 (ID: 1)\n";
echo "- alice#0002 (ID: 2)\n";
echo "- bob#0003 (ID: 3)\n";
?>