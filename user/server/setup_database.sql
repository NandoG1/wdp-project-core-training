-- Discord Clone Database Setup
-- Drop existing tables if they exist
DROP TABLE IF EXISTS UserServerMemberships;
DROP TABLE IF EXISTS Channel;
DROP TABLE IF EXISTS ServerInfo;
DROP TABLE IF EXISTS FriendList;
DROP TABLE IF EXISTS Server;
DROP TABLE IF EXISTS Users;

-- Create Users table
CREATE TABLE Users (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    UserID INT,
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
CREATE TABLE Server (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(255) NOT NULL,
    IconServer VARCHAR(255),
    Description TEXT,
    BannerServer VARCHAR(255),
    IsPrivate BOOLEAN DEFAULT 0,
    InviteLink VARCHAR(255) UNIQUE
);

-- Create ServerInfo table
CREATE TABLE ServerInfo (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ServerID INT NOT NULL,
    InviteUserID INT,
    InviteLink VARCHAR(255),
    ExpiresAt DATE,
    Category VARCHAR(100) DEFAULT 'General',
    FOREIGN KEY (ServerID) REFERENCES Server(ID) ON DELETE CASCADE,
    FOREIGN KEY (InviteUserID) REFERENCES Users(ID) ON DELETE SET NULL
);

-- Create Channel table
CREATE TABLE Channel (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ServerID INT NOT NULL,
    Name VARCHAR(255) NOT NULL,
    Type VARCHAR(50) DEFAULT 'text',
    FOREIGN KEY (ServerID) REFERENCES Server(ID) ON DELETE CASCADE
);

-- Create UserServerMemberships table
CREATE TABLE UserServerMemberships (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    ServerID INT NOT NULL,
    Role VARCHAR(50) DEFAULT 'Member',
    JoinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE,
    FOREIGN KEY (ServerID) REFERENCES Server(ID) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (UserID, ServerID)
);

-- Create FriendList table
CREATE TABLE FriendList (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    UserID1 INT NOT NULL,
    UserID2 INT NOT NULL,
    Status VARCHAR(50) DEFAULT 'pending',
    FOREIGN KEY (UserID1) REFERENCES Users(ID) ON DELETE CASCADE,
    FOREIGN KEY (UserID2) REFERENCES Users(ID) ON DELETE CASCADE
);

-- Insert sample users
INSERT INTO Users (Username, Email, Password, AvatarURL, Status, DisplayName, Bio, Discriminator) VALUES
('john_gamer', 'john@example.com', 'hashed_password_1', 'https://via.placeholder.com/64x64/FF6B6B/FFFFFF?text=JG', 'online', 'John Gamer', 'Love playing games and chatting with friends!', '0001'),
('sarah_music', 'sarah@example.com', 'hashed_password_2', 'https://via.placeholder.com/64x64/4ECDC4/FFFFFF?text=SM', 'online', 'Sarah Music', 'Music is life! 🎵', '0002'),
('mike_tech', 'mike@example.com', 'hashed_password_3', 'https://via.placeholder.com/64x64/45B7D1/FFFFFF?text=MT', 'away', 'Mike Tech', 'Software developer and tech enthusiast', '0003'),
('admin_user', 'admin@example.com', 'admin_password', 'https://via.placeholder.com/64x64/96CEB4/FFFFFF?text=AD', 'online', 'Admin', 'Server administrator', '0000');

-- Insert sample servers with diverse categories
INSERT INTO Server (Name, IconServer, Description, BannerServer, IsPrivate, InviteLink) VALUES
-- Gaming Servers
('Epic Gamers Hub', 'https://via.placeholder.com/64x64/FF6B6B/FFFFFF?text=EG', 'The ultimate gaming community for all types of games', 'https://via.placeholder.com/600x150/FF6B6B/FFFFFF?text=Epic+Gamers+Hub', 0, 'epicgamers123'),
('Minecraft Builders', 'https://via.placeholder.com/64x64/4ECDC4/FFFFFF?text=MC', 'Creative builders and redstone engineers welcome!', 'https://via.placeholder.com/600x150/4ECDC4/FFFFFF?text=Minecraft+Builders', 0, 'mcbuilders456'),
('FPS Champions', 'https://via.placeholder.com/64x64/45B7D1/FFFFFF?text=FPS', 'Competitive FPS gaming community', 'https://via.placeholder.com/600x150/45B7D1/FFFFFF?text=FPS+Champions', 0, 'fpschamps789'),
('Retro Gaming', 'https://via.placeholder.com/64x64/F7DC6F/FFFFFF?text=RG', 'Nostalgia and classic games discussion', 'https://via.placeholder.com/600x150/F7DC6F/FFFFFF?text=Retro+Gaming', 0, 'retrogaming101'),

-- Music Servers
('Melody Makers', 'https://via.placeholder.com/64x64/BB8FCE/FFFFFF?text=MM', 'Musicians, producers, and music lovers unite!', 'https://via.placeholder.com/600x150/BB8FCE/FFFFFF?text=Melody+Makers', 0, 'melodymakers202'),
('EDM Vibes', 'https://via.placeholder.com/64x64/58D68D/FFFFFF?text=EDM', 'Electronic dance music community', 'https://via.placeholder.com/600x150/58D68D/FFFFFF?text=EDM+Vibes', 0, 'edmvibes303'),
('Classical Corner', 'https://via.placeholder.com/64x64/F1948A/FFFFFF?text=CC', 'Classical music appreciation society', 'https://via.placeholder.com/600x150/F1948A/FFFFFF?text=Classical+Corner', 0, 'classical404'),

-- Technology Servers
('Code Academy', 'https://via.placeholder.com/64x64/5DADE2/FFFFFF?text=CA', 'Learn programming and share coding knowledge', 'https://via.placeholder.com/600x150/5DADE2/FFFFFF?text=Code+Academy', 0, 'codeacademy505'),
('AI & Machine Learning', 'https://via.placeholder.com/64x64/AF7AC5/FFFFFF?text=AI', 'Artificial Intelligence and ML discussions', 'https://via.placeholder.com/600x150/AF7AC5/FFFFFF?text=AI+ML', 0, 'aiml606'),
('Web Developers', 'https://via.placeholder.com/64x64/52BE80/FFFFFF?text=WD', 'Frontend, backend, and fullstack developers', 'https://via.placeholder.com/600x150/52BE80/FFFFFF?text=Web+Developers', 0, 'webdevs707'),

-- Education Servers
('Study Group', 'https://via.placeholder.com/64x64/F8C471/FFFFFF?text=SG', 'Collaborative learning and study sessions', 'https://via.placeholder.com/600x150/F8C471/FFFFFF?text=Study+Group', 0, 'studygroup808'),
('Language Exchange', 'https://via.placeholder.com/64x64/85C1E9/FFFFFF?text=LE', 'Practice languages with native speakers', 'https://via.placeholder.com/600x150/85C1E9/FFFFFF?text=Language+Exchange', 0, 'langexchange909'),

-- Art & Creative Servers
('Digital Artists', 'https://via.placeholder.com/64x64/E74C3C/FFFFFF?text=DA', 'Digital art, illustrations, and design', 'https://via.placeholder.com/600x150/E74C3C/FFFFFF?text=Digital+Artists', 0, 'digitalart010'),
('Photography Club', 'https://via.placeholder.com/64x64/3498DB/FFFFFF?text=PC', 'Share and critique photography work', 'https://via.placeholder.com/600x150/3498DB/FFFFFF?text=Photography+Club', 0, 'photoclub111'),

-- Entertainment Servers
('Movie Night', 'https://via.placeholder.com/64x64/9B59B6/FFFFFF?text=MN', 'Watch movies together and discuss cinema', 'https://via.placeholder.com/600x150/9B59B6/FFFFFF?text=Movie+Night', 0, 'movienight212'),
('Anime Lovers', 'https://via.placeholder.com/64x64/E67E22/FFFFFF?text=AL', 'Anime, manga, and Japanese culture', 'https://via.placeholder.com/600x150/E67E22/FFFFFF?text=Anime+Lovers', 0, 'animelovers313'),

-- Community Servers
('Local Community', 'https://via.placeholder.com/64x64/27AE60/FFFFFF?text=LC', 'Connect with people in your area', 'https://via.placeholder.com/600x150/27AE60/FFFFFF?text=Local+Community', 0, 'localcomm414'),
('Random Chat', 'https://via.placeholder.com/64x64/F39C12/FFFFFF?text=RC', 'General discussion and random topics', 'https://via.placeholder.com/600x150/F39C12/FFFFFF?text=Random+Chat', 0, 'randomchat515'),

-- Sports Servers
('Football Fans', 'https://via.placeholder.com/64x64/16A085/FFFFFF?text=FF', 'Discuss matches, teams, and player stats', 'https://via.placeholder.com/600x150/16A085/FFFFFF?text=Football+Fans', 0, 'footballfans616'),
('Fitness Motivation', 'https://via.placeholder.com/64x64/D35400/FFFFFF?text=FM', 'Workout tips, nutrition, and motivation', 'https://via.placeholder.com/600x150/D35400/FFFFFF?text=Fitness+Motivation', 0, 'fitness717');

-- Insert ServerInfo with categories
INSERT INTO ServerInfo (ServerID, InviteUserID, InviteLink, Category) VALUES
-- Gaming
(1, 1, 'epicgamers123', 'Gaming'),
(2, 1, 'mcbuilders456', 'Gaming'),
(3, 1, 'fpschamps789', 'Gaming'),
(4, 1, 'retrogaming101', 'Gaming'),

-- Music
(5, 2, 'melodymakers202', 'Music'),
(6, 2, 'edmvibes303', 'Music'),
(7, 2, 'classical404', 'Music'),

-- Technology
(8, 3, 'codeacademy505', 'Technology'),
(9, 3, 'aiml606', 'Technology'),
(10, 3, 'webdevs707', 'Technology'),

-- Education
(11, 1, 'studygroup808', 'Education'),
(12, 2, 'langexchange909', 'Education'),

-- Art
(13, 1, 'digitalart010', 'Art'),
(14, 2, 'photoclub111', 'Art'),

-- Entertainment
(15, 1, 'movienight212', 'Entertainment'),
(16, 2, 'animelovers313', 'Entertainment'),

-- Community
(17, 1, 'localcomm414', 'Community'),
(18, 2, 'randomchat515', 'Community'),

-- Sports
(19, 1, 'footballfans616', 'Sports'),
(20, 2, 'fitness717', 'Sports');

-- Insert sample memberships
INSERT INTO UserServerMemberships (UserID, ServerID, Role) VALUES
-- User 1 (john_gamer) memberships
(1, 1, 'Owner'),
(1, 2, 'Admin'),
(1, 3, 'Member'),
(1, 8, 'Member'),
(1, 15, 'Member'),

-- User 2 (sarah_music) memberships
(2, 5, 'Owner'),
(2, 6, 'Admin'),
(2, 7, 'Member'),
(2, 1, 'Member'),
(2, 16, 'Member'),

-- User 3 (mike_tech) memberships
(3, 8, 'Owner'),
(3, 9, 'Admin'),
(3, 10, 'Member'),
(3, 1, 'Member'),
(3, 2, 'Member'),

-- Add random members to make servers look populated
(4, 1, 'Member'),
(4, 2, 'Member'),
(4, 3, 'Member'),
(4, 5, 'Member'),
(4, 8, 'Member'),
(4, 15, 'Member'),
(4, 16, 'Member'),
(4, 17, 'Member');

-- Insert sample channels for servers
INSERT INTO Channel (ServerID, Name, Type) VALUES
-- Epic Gamers Hub channels
(1, 'general', 'text'),
(1, 'game-discussion', 'text'),
(1, 'voice-chat', 'voice'),

-- Minecraft Builders channels
(2, 'general', 'text'),
(2, 'build-showcase', 'text'),
(2, 'redstone-help', 'text'),

-- Code Academy channels
(8, 'general', 'text'),
(8, 'help-desk', 'text'),
(8, 'project-showcase', 'text'),

-- Melody Makers channels
(5, 'general', 'text'),
(5, 'song-sharing', 'text'),
(5, 'collaboration', 'text');