# Discord Clone - Server Loading Issue Troubleshooting

## Issue
The `loadServers()` function in `user-explore.js` is showing "Failed to load servers2" error.

## Root Cause
The environment is missing required infrastructure components:

1. **PHP Runtime**: Not installed/available
2. **Database Server**: MySQL/MariaDB not running on port 3307
3. **Web Server**: No Apache/Nginx to serve PHP scripts

## Current Configuration
- Database: `misvord` on `localhost:3307`
- User: `root` with no password
- PHP script: `user-explore.php` handles AJAX requests

## Solutions

### Option 1: Install Required Infrastructure (Recommended)

```bash
# Install PHP and MySQL
sudo apt update
sudo apt install php mysql-server php-mysql

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database and user
sudo mysql -e "CREATE DATABASE misvord;"
sudo mysql -e "CREATE USER 'root'@'localhost' IDENTIFIED BY '';"
sudo mysql -e "GRANT ALL PRIVILEGES ON misvord.* TO 'root'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Install web server
sudo apt install apache2
sudo systemctl start apache2
sudo systemctl enable apache2
```

### Option 2: Use Docker (Alternative)

```bash
# Run MySQL container
docker run -d \
  --name mysql-discord \
  -e MYSQL_ROOT_PASSWORD= \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -e MYSQL_DATABASE=misvord \
  -p 3307:3306 \
  mysql:8.0

# Run PHP with Apache
docker run -d \
  --name php-discord \
  -p 80:80 \
  -v $(pwd):/var/www/html \
  --link mysql-discord:mysql \
  php:apache
```

### Option 3: Mock Data for Testing

Create a mock response in JavaScript to test the frontend:

```javascript
// Add this to user-explore.js for testing
function loadServersWithMockData(showLoading = false) {
  if (isLoading) return
  
  isLoading = true
  
  if (showLoading) {
    $("#loadingIndicator").show()
  }
  
  // Mock server data
  const mockServers = [
    {
      ID: 1,
      Name: "Gaming Community",
      Description: "A place for gamers to chat and play together",
      Category: "Gaming",
      IconServer: null,
      member_count: 1337,
      is_joined: 0
    },
    {
      ID: 2,
      Name: "Music Lovers",
      Description: "Share and discover new music",
      Category: "Music", 
      IconServer: null,
      member_count: 842,
      is_joined: 0
    }
  ];
  
  // Simulate async response
  setTimeout(() => {
    displayServers(mockServers)
    
    if (mockServers.length < 12) {
      hasMoreServers = false
      $("#noMoreServers").show()
    }
    
    currentPage++
    updateServerCount()
    
    isLoading = false
    $("#loadingIndicator").hide()
  }, 500);
}
```

### Option 4: Database Schema Setup

If you have the infrastructure running, create these tables:

```sql
CREATE TABLE Server (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    IconServer VARCHAR(255),
    Description TEXT,
    BannerServer VARCHAR(255),
    InviteLink VARCHAR(255),
    IsPrivate BOOLEAN DEFAULT 0
);

CREATE TABLE ServerInfo (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ServerID INT,
    Category VARCHAR(100),
    ExpiresAt DATE,
    FOREIGN KEY (ServerID) REFERENCES Server(ID)
);

CREATE TABLE UserServerMemberships (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT,
    ServerID INT,
    Role VARCHAR(50) DEFAULT 'Member',
    FOREIGN KEY (ServerID) REFERENCES Server(ID)
);
```

## Quick Debug Steps

1. Check browser console for exact error details
2. Test direct PHP script access: `http://localhost/user/server/user-explore.php`
3. Verify database connection in `database.php`
4. Check PHP error logs
5. Test with mock data (Option 3)

## Environment Status
Current findings:
- ❌ PHP: Not found
- ❌ MySQL: Not running
- ❌ Web Server: Not detected
- ❌ Port 3307: Not listening

Choose the solution that best fits your development environment!