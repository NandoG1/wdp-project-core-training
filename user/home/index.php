<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: /auth/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];
$username = $_SESSION['username'] ?? 'Guest';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MisVord - Home</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
    <script>
        window.currentUser = {
            id: <?php echo $user_id; ?>,
            username: '<?php echo htmlspecialchars($username); ?>'
        };
    </script>
    <div class="app-container">

        <div class="server-sidebar">
            <div class="server-nav">
                <div class="server-item home-server active" data-tooltip="Home">
                    <div class="server-icon">
                        <a href="../home/index.php">
                            <i class="fas fa-home"></i>
                        </a>
                    </div>
                </div>
                
                <div class="server-separator"></div>
                
                <div class="user-servers" id="userServersList">
                    <div class="server-item" data-tooltip="My Server">
                        <div class="server-icon">
                            <a href="../user-server/index.php">
                                <i class="fas fa-comments"></i>
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="server-separator"></div>
                
                <div class="server-item" data-tooltip="Explore Public Servers">
                    <div class="server-icon">
                        <a href="../server/user-explore.php">
                            <i class="fas fa-compass"></i>
                        </a>
                    </div>
                </div>
            
            </div>
        </div>
        <div class="sidebar">
            <div class="sidebar-header" style="display: none;">
                <div class="user-info">
                    <img src="" alt="User Avatar" class="user-avatar" id="currentUserAvatar">
                    <div class="user-details">
                        <span class="username" id="currentUsername"><?php echo htmlspecialchars($username); ?></span>
                        <span class="discriminator" id="currentDiscriminator">#0000</span>
                    </div>
                </div>
            </div>

            <div class="sidebar-content">
                <div class="search-container">
                    <input type="text" placeholder="Find or start a conversation..." class="search-input" id="conversationSearch">
                </div>

                <div class="nav-tabs">
                    <div class="nav-tab active" data-tab="friends">
                        <i class="fas fa-user-friends"></i>
                        <span>Friends</span>
                    </div>
                    <a href="../nitro/nitro.php">
                        <div class="nav-tab" data-tab="nitro">
                            <i class="fas fa-bolt"></i>
                            <span>Nitro</span>
                        </div>
                    </a>
                </div>

                <div class="direct-messages">
                    <div class="section-header">
                        <span>DIRECT MESSAGES</span>
                        <button class="create-dm-btn" id="openDMModalBtn">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="dm-list" id="directMessagesList">
                    </div>
                </div>
            </div>

            <div class="user-panel">
                <div class="user-info-panel">
                    <img src="" alt="Avatar" class="panel-avatar" id="panelUserAvatar">
                    <div class="user-status">
                        <span class="panel-username" id="panelUsername">Loading...</span>
                        <span class="panel-discriminator" id="panelDiscriminator">#0000</span>
                    </div>
                </div>
                <div class="user-controls">
                    <button class="control-btn" title="Mute"><i class="fas fa-microphone-slash"></i></button>
                    <button class="control-btn" title="Deafen"><i class="fas fa-headphones"></i></button>
                    <button class="control-btn" title="Settings" onclick="alert('Please go to user-server page to change your account')"><i class="fas fa-cog"></i></button>
                </div>
            </div>
        </div>

        <div class="main-content">
            <div class="friends-section" id="friendsSection">
                <div class="friends-header">
                    <h2><i class="fas fa-user-friends"></i> Friends</h2>
                    <div class="friends-tabs">
                        <button class="friends-tab active" data-tab="online">Online</button>
                        <button class="friends-tab" data-tab="all">All</button>
                        <button class="friends-tab" data-tab="pending">Pending</button>
                        <button class="friends-tab add-friend" data-tab="add">Add Friend</button>
                    </div>
                </div>

                <div class="friends-content">
                    <div class="tab-content active" id="onlineTab">
                        <div class="search-container">
                            <input type="text" placeholder="Search online friends..." class="search-input" id="onlineSearch">
                        </div>
                        <div class="friends-list" id="onlineFriendsList">

                        </div>
                    </div>

                    <div class="tab-content" id="allTab">
                        <div class="search-container">
                            <input type="text" placeholder="Search all friends..." class="search-input" id="allSearch">
                        </div>
                        <div class="friends-list" id="allFriendsList">

                        </div>
                    </div>

                    <div class="tab-content" id="pendingTab">
                        <div class="search-container">
                            <input type="text" placeholder="Search requests..." class="search-input" id="pendingSearch">
                        </div>
                        <div class="pending-sections">
                            <div class="pending-section">
                                <h3>INCOMING FRIEND REQUESTS — <span id="incomingCount">0</span></h3>
                                <div class="friends-list" id="incomingRequestsList">
   
                                </div>
                            </div>
                            <div class="pending-section">
                                <h3>OUTGOING FRIEND REQUESTS — <span id="outgoingCount">0</span></h3>
                                <div class="friends-list" id="outgoingRequestsList">
              
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tab-content" id="addTab">
                        <div class="add-friend-container">
                            <h3>Add Friend</h3>
                            <p>You can add friends with their MisVord username or full username#discriminator.</p>
                            <div class="add-friend-form">
                                <label for="usernameInput">ADD FRIEND</label>
                                <div class="input-group">
                                    <input type="text" id="usernameInput" placeholder="Username#XXXX" maxlength="37">
                                    <button type="button" id="sendFriendRequest">Send Friend Request</button>
                                </div>
                                <div class="error-message" id="addFriendError"></div>
                                <div class="success-message" id="addFriendSuccess"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="chat-section hidden" id="chatSection">
                <div class="chat-header">
                    <div class="chat-info">
                        <div class="chat-icon">
                            <i class="fas fa-at"></i>
                        </div>
                        <div class="chat-details">
                            <span class="chat-name" id="chatName">Select a conversation</span>
                            <span class="chat-status" id="chatStatus"></span>
                        </div>
                    </div>
                </div>

                <div class="chat-messages" id="chatMessages">

                </div>

                <div class="typing-indicator hidden" id="typingIndicator">
                    <span id="typingText"></span>
                </div>

                <div class="message-input-container">
                    <div class="reply-context hidden" id="replyContext">
                        <div class="reply-info">
                            <span>Replying to <strong id="replyUsername"></strong></span>
                            <span class="reply-content" id="replyContent"></span>
                        </div>
                        <button class="cancel-reply" id="cancelReply">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="file-preview-container hidden" id="filePreviewContainer">
                        <div class="file-previews" id="filePreviews">

                        </div>
                    </div>
                    <div class="message-input">
                        <button class="attachment-btn" id="attachmentBtn">
                            <i class="fas fa-plus"></i>
                        </button>
                        <input type="file" id="fileInput" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" style="display: none;">
                        <div class="input-wrapper">
                            <textarea placeholder="Message..." id="messageInput" rows="1"></textarea>
                        </div>
                        <div class="message-actions">
                            <button class="action-btn" id="emojiBtn"><i class="fas fa-smile"></i></button>
                            <button class="action-btn" id="sendBtn"><i class="fas fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="active-now-section" id="activeNowSection">
            <div class="active-now-header">
                <h3>Active Now</h3>
            </div>
            <div class="active-now-list" id="activeNowList">

            </div>
        </div>
    </div>

    <div class="modal hidden" id="createDMModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>New Direct Message</h3>
                <button class="modal-close" id="closeDMModal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="select-users-section">
                    <label>SELECT USERS</label>
                    <div class="search-container">
                        <input type="text" placeholder="Search friends..." id="dmUserSearch">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="selected-users" id="selectedUsers">
                        <span class="selected-count">SELECTED USERS (0):</span>
                        <div class="selected-user-tags" id="selectedUserTags">

                        </div>
                    </div>
                    <div class="user-list" id="dmUserList">

                    </div>
                </div>
                <div class="group-settings hidden" id="groupSettings">
                    <label>GROUP NAME</label>
                    <input type="text" placeholder="Enter group name" id="groupNameInput">
                    <label>GROUP IMAGE</label>
                    <p>We recommend an image of at least 512×512.</p>
                    <div class="group-image-upload">
                        <div class="image-placeholder" id="groupImagePlaceholder">
                            <i class="fas fa-camera"></i>
                        </div>
                        <input type="file" id="groupImageInput" accept="image/*" style="display: none;">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelDM">Cancel</button>
                <button class="btn-primary" id="createDMSubmitBtn">Create Message</button>
            </div>
        </div>
    </div>

    <div class="modal hidden" id="deleteMessageModal">
        <div class="modal-content small">
            <div class="modal-header">
                <h3>Delete Message</h3>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this message? This cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelDelete">Cancel</button>
                <button class="btn-danger" id="confirmDelete">Delete</button>
            </div>
        </div>
    </div>

    <div class="emoji-picker hidden" id="emojiPicker">
        <div class="emoji-categories">
            <button class="emoji-category active" data-category="smileys">😀</button>
            <button class="emoji-category" data-category="people">👋</button>
            <button class="emoji-category" data-category="nature">🌱</button>
            <button class="emoji-category" data-category="food">🍎</button>
            <button class="emoji-category" data-category="activities">⚽</button>
            <button class="emoji-category" data-category="travel">🚗</button>
            <button class="emoji-category" data-category="objects">💡</button>
            <button class="emoji-category" data-category="symbols">❤️</button>
            <button class="emoji-category" data-category="flags">🏁</button>
        </div>
        <div class="emoji-grid" id="emojiGrid">

        </div>
    </div>

    <script src="assets/js/socket-client.js"></script>
    <script src="assets/js/home.js"></script>
    <script src="assets/js/chat.js"></script>
    <script src="assets/js/friends.js"></script>
    <script src="assets/js/emoji.js"></script>
</body>
</html>