<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'misvord';
    private $username = 'root';
    private $password = '';
    private $port = 3307;
    public $conn;

    public function getConnection() {
        try {
            // Try SQLite first for easier setup
            $sqliteFile = __DIR__ . '/discord_clone.db';
            $this->conn = new PDO("sqlite:$sqliteFile");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Initialize database if it's new
            $this->initializeDatabase();
            
            return $this->conn;
        } catch (PDOException $e) {
            try {
                // Fallback to MySQL if available
                $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
                $this->conn = new PDO($dsn, $this->username, $this->password);
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                return $this->conn;
            } catch (PDOException $mysql_e) {
                die("Database connection failed: " . $e->getMessage() . " | MySQL: " . $mysql_e->getMessage());
            }
        }
    }

    private function initializeDatabase() {
        // Check if tables exist
        $stmt = $this->conn->query("SELECT name FROM sqlite_master WHERE type='table' AND name='Server'");
        if ($stmt->rowCount() == 0) {
            // Tables don't exist, create them
            $this->createTables();
            $this->insertSampleData();
        }
    }

    private function createTables() {
        $sql = "
        -- Create Users table
        CREATE TABLE IF NOT EXISTS Users (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Username VARCHAR(255) NOT NULL UNIQUE,
            Email VARCHAR(255) NOT NULL UNIQUE,
            Password VARCHAR(255) NOT NULL,
            UserID INTEGER,
            AvatarURL VARCHAR(255),
            Status VARCHAR(255) DEFAULT 'online',
            ProfilePictureUrl VARCHAR(255),
            SecurityQuestion VARCHAR(255),
            SecurityAnswer VARCHAR(255),
            Bio TEXT,
            DisplayName VARCHAR(255),
            Discriminator CHAR(4) DEFAULT '0001'
        );

        -- Create Server table
        CREATE TABLE IF NOT EXISTS Server (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name VARCHAR(255) NOT NULL,
            IconServer VARCHAR(255),
            Description TEXT,
            BannerServer VARCHAR(255),
            IsPrivate INTEGER DEFAULT 0,
            InviteLink VARCHAR(255) UNIQUE
        );

        -- Create ServerInfo table
        CREATE TABLE IF NOT EXISTS ServerInfo (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ServerID INTEGER NOT NULL,
            InviteUserID INTEGER,
            InviteLink VARCHAR(255),
            ExpiresAt DATE,
            Category VARCHAR(100) DEFAULT 'General',
            FOREIGN KEY (ServerID) REFERENCES Server(ID) ON DELETE CASCADE,
            FOREIGN KEY (InviteUserID) REFERENCES Users(ID) ON DELETE SET NULL
        );

        -- Create Channel table
        CREATE TABLE IF NOT EXISTS Channel (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ServerID INTEGER NOT NULL,
            Name VARCHAR(255) NOT NULL,
            Type VARCHAR(50) DEFAULT 'text',
            FOREIGN KEY (ServerID) REFERENCES Server(ID) ON DELETE CASCADE
        );

        -- Create UserServerMemberships table
        CREATE TABLE IF NOT EXISTS UserServerMemberships (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            UserID INTEGER NOT NULL,
            ServerID INTEGER NOT NULL,
            Role VARCHAR(50) DEFAULT 'Member',
            JoinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE,
            FOREIGN KEY (ServerID) REFERENCES Server(ID) ON DELETE CASCADE,
            UNIQUE(UserID, ServerID)
        );

        -- Create FriendList table
        CREATE TABLE IF NOT EXISTS FriendList (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            UserID1 INTEGER NOT NULL,
            UserID2 INTEGER NOT NULL,
            Status VARCHAR(50) DEFAULT 'pending',
            FOREIGN KEY (UserID1) REFERENCES Users(ID) ON DELETE CASCADE,
            FOREIGN KEY (UserID2) REFERENCES Users(ID) ON DELETE CASCADE
        );";

        $this->conn->exec($sql);
    }

    private function insertSampleData() {
        // Insert sample users
        $stmt = $this->conn->prepare("
            INSERT INTO Users (Username, Email, Password, AvatarURL, Status, DisplayName, Bio, Discriminator) VALUES
            ('john_gamer', 'john@example.com', 'hashed_password_1', 'https://via.placeholder.com/64x64/FF6B6B/FFFFFF?text=JG', 'online', 'John Gamer', 'Love playing games and chatting with friends!', '0001'),
            ('sarah_music', 'sarah@example.com', 'hashed_password_2', 'https://via.placeholder.com/64x64/4ECDC4/FFFFFF?text=SM', 'online', 'Sarah Music', 'Music is life! 🎵', '0002'),
            ('mike_tech', 'mike@example.com', 'hashed_password_3', 'https://via.placeholder.com/64x64/45B7D1/FFFFFF?text=MT', 'away', 'Mike Tech', 'Software developer and tech enthusiast', '0003'),
            ('admin_user', 'admin@example.com', 'admin_password', 'https://via.placeholder.com/64x64/96CEB4/FFFFFF?text=AD', 'online', 'Admin', 'Server administrator', '0000')
        ");
        $stmt->execute();

        // Insert sample servers
        $servers = [
            ['Epic Gamers Hub', 'https://via.placeholder.com/64x64/FF6B6B/FFFFFF?text=EG', 'The ultimate gaming community for all types of games', 'https://via.placeholder.com/600x150/FF6B6B/FFFFFF?text=Epic+Gamers+Hub', 0, 'epicgamers123'],
            ['Minecraft Builders', 'https://via.placeholder.com/64x64/4ECDC4/FFFFFF?text=MC', 'Creative builders and redstone engineers welcome!', 'https://via.placeholder.com/600x150/4ECDC4/FFFFFF?text=Minecraft+Builders', 0, 'mcbuilders456'],
            ['FPS Champions', 'https://via.placeholder.com/64x64/45B7D1/FFFFFF?text=FPS', 'Competitive FPS gaming community', 'https://via.placeholder.com/600x150/45B7D1/FFFFFF?text=FPS+Champions', 0, 'fpschamps789'],
            ['Retro Gaming', 'https://via.placeholder.com/64x64/F7DC6F/FFFFFF?text=RG', 'Nostalgia and classic games discussion', 'https://via.placeholder.com/600x150/F7DC6F/FFFFFF?text=Retro+Gaming', 0, 'retrogaming101'],
            ['Melody Makers', 'https://via.placeholder.com/64x64/BB8FCE/FFFFFF?text=MM', 'Musicians, producers, and music lovers unite!', 'https://via.placeholder.com/600x150/BB8FCE/FFFFFF?text=Melody+Makers', 0, 'melodymakers202'],
            ['EDM Vibes', 'https://via.placeholder.com/64x64/58D68D/FFFFFF?text=EDM', 'Electronic dance music community', 'https://via.placeholder.com/600x150/58D68D/FFFFFF?text=EDM+Vibes', 0, 'edmvibes303'],
            ['Classical Corner', 'https://via.placeholder.com/64x64/F1948A/FFFFFF?text=CC', 'Classical music appreciation society', 'https://via.placeholder.com/600x150/F1948A/FFFFFF?text=Classical+Corner', 0, 'classical404'],
            ['Code Academy', 'https://via.placeholder.com/64x64/5DADE2/FFFFFF?text=CA', 'Learn programming and share coding knowledge', 'https://via.placeholder.com/600x150/5DADE2/FFFFFF?text=Code+Academy', 0, 'codeacademy505'],
            ['AI & Machine Learning', 'https://via.placeholder.com/64x64/AF7AC5/FFFFFF?text=AI', 'Artificial Intelligence and ML discussions', 'https://via.placeholder.com/600x150/AF7AC5/FFFFFF?text=AI+ML', 0, 'aiml606'],
            ['Web Developers', 'https://via.placeholder.com/64x64/52BE80/FFFFFF?text=WD', 'Frontend, backend, and fullstack developers', 'https://via.placeholder.com/600x150/52BE80/FFFFFF?text=Web+Developers', 0, 'webdevs707'],
            ['Study Group', 'https://via.placeholder.com/64x64/F8C471/FFFFFF?text=SG', 'Collaborative learning and study sessions', 'https://via.placeholder.com/600x150/F8C471/FFFFFF?text=Study+Group', 0, 'studygroup808'],
            ['Language Exchange', 'https://via.placeholder.com/64x64/85C1E9/FFFFFF?text=LE', 'Practice languages with native speakers', 'https://via.placeholder.com/600x150/85C1E9/FFFFFF?text=Language+Exchange', 0, 'langexchange909'],
            ['Digital Artists', 'https://via.placeholder.com/64x64/E74C3C/FFFFFF?text=DA', 'Digital art, illustrations, and design', 'https://via.placeholder.com/600x150/E74C3C/FFFFFF?text=Digital+Artists', 0, 'digitalart010'],
            ['Photography Club', 'https://via.placeholder.com/64x64/3498DB/FFFFFF?text=PC', 'Share and critique photography work', 'https://via.placeholder.com/600x150/3498DB/FFFFFF?text=Photography+Club', 0, 'photoclub111'],
            ['Movie Night', 'https://via.placeholder.com/64x64/9B59B6/FFFFFF?text=MN', 'Watch movies together and discuss cinema', 'https://via.placeholder.com/600x150/9B59B6/FFFFFF?text=Movie+Night', 0, 'movienight212'],
            ['Anime Lovers', 'https://via.placeholder.com/64x64/E67E22/FFFFFF?text=AL', 'Anime, manga, and Japanese culture', 'https://via.placeholder.com/600x150/E67E22/FFFFFF?text=Anime+Lovers', 0, 'animelovers313'],
            ['Local Community', 'https://via.placeholder.com/64x64/27AE60/FFFFFF?text=LC', 'Connect with people in your area', 'https://via.placeholder.com/600x150/27AE60/FFFFFF?text=Local+Community', 0, 'localcomm414'],
            ['Random Chat', 'https://via.placeholder.com/64x64/F39C12/FFFFFF?text=RC', 'General discussion and random topics', 'https://via.placeholder.com/600x150/F39C12/FFFFFF?text=Random+Chat', 0, 'randomchat515'],
            ['Football Fans', 'https://via.placeholder.com/64x64/16A085/FFFFFF?text=FF', 'Discuss matches, teams, and player stats', 'https://via.placeholder.com/600x150/16A085/FFFFFF?text=Football+Fans', 0, 'footballfans616'],
            ['Fitness Motivation', 'https://via.placeholder.com/64x64/D35400/FFFFFF?text=FM', 'Workout tips, nutrition, and motivation', 'https://via.placeholder.com/600x150/D35400/FFFFFF?text=Fitness+Motivation', 0, 'fitness717']
        ];

        $stmt = $this->conn->prepare("INSERT INTO Server (Name, IconServer, Description, BannerServer, IsPrivate, InviteLink) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($servers as $server) {
            $stmt->execute($server);
        }

        // Insert ServerInfo with categories
        $categories = [
            [1, 1, 'epicgamers123', 'Gaming'],
            [2, 1, 'mcbuilders456', 'Gaming'],
            [3, 1, 'fpschamps789', 'Gaming'],
            [4, 1, 'retrogaming101', 'Gaming'],
            [5, 2, 'melodymakers202', 'Music'],
            [6, 2, 'edmvibes303', 'Music'],
            [7, 2, 'classical404', 'Music'],
            [8, 3, 'codeacademy505', 'Technology'],
            [9, 3, 'aiml606', 'Technology'],
            [10, 3, 'webdevs707', 'Technology'],
            [11, 1, 'studygroup808', 'Education'],
            [12, 2, 'langexchange909', 'Education'],
            [13, 1, 'digitalart010', 'Art'],
            [14, 2, 'photoclub111', 'Art'],
            [15, 1, 'movienight212', 'Entertainment'],
            [16, 2, 'animelovers313', 'Entertainment'],
            [17, 1, 'localcomm414', 'Community'],
            [18, 2, 'randomchat515', 'Community'],
            [19, 1, 'footballfans616', 'Sports'],
            [20, 2, 'fitness717', 'Sports']
        ];

        $stmt = $this->conn->prepare("INSERT INTO ServerInfo (ServerID, InviteUserID, InviteLink, Category) VALUES (?, ?, ?, ?)");
        foreach ($categories as $category) {
            $stmt->execute($category);
        }

        // Insert sample memberships
        $memberships = [
            [1, 1, 'Owner'], [1, 2, 'Admin'], [1, 3, 'Member'], [1, 8, 'Member'], [1, 15, 'Member'],
            [2, 5, 'Owner'], [2, 6, 'Admin'], [2, 7, 'Member'], [2, 1, 'Member'], [2, 16, 'Member'],
            [3, 8, 'Owner'], [3, 9, 'Admin'], [3, 10, 'Member'], [3, 1, 'Member'], [3, 2, 'Member'],
            [4, 1, 'Member'], [4, 2, 'Member'], [4, 3, 'Member'], [4, 5, 'Member'], [4, 8, 'Member']
        ];

        $stmt = $this->conn->prepare("INSERT INTO UserServerMemberships (UserID, ServerID, Role) VALUES (?, ?, ?)");
        foreach ($memberships as $membership) {
            $stmt->execute($membership);
        }
    }
}
?>
