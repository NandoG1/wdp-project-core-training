// Socket.IO client for real-time communication
class SocketClient {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.currentUser = null;
        this.typingUsers = new Set();
        this.typingTimeout = null;
        this.init();
    }

    init() {
        // Initialize socket connection
        this.socket = io('http://localhost:8010', {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            timeout: 20000
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            this.authenticateUser();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection failed:', error);
            console.log('Error details:', {
                message: error.message,
                description: error.description,
                context: error.context,
                type: error.type
            });
            
            // Try to reconnect with different transport
            setTimeout(() => {
                console.log('Attempting to reconnect...');
                this.socket.connect();
            }, 5000);
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('WebSocket reconnection failed:', error);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('WebSocket reconnected after', attemptNumber, 'attempts');
        });

        // User authentication
        this.socket.on('authenticated', (userData) => {
            console.log('Successfully authenticated:', userData);
            this.currentUser = userData;
            this.updateUserStatus('online');
        });

        this.socket.on('authentication_failed', (data) => {
            console.error('Authentication failed:', data.message);
        });

        // Friend requests
        this.socket.on('friend_request_received', (data) => {
            this.handleFriendRequestReceived(data);
        });

        this.socket.on('friend_request_accepted', (data) => {
            this.handleFriendRequestAccepted(data);
        });

        // Message events
        this.socket.on('new_message', (data) => {
            this.handleNewMessage(data);
        });

        this.socket.on('message_edited', (data) => {
            this.handleMessageEdited(data);
        });

        this.socket.on('message_deleted', (data) => {
            this.handleMessageDeleted(data);
        });

        this.socket.on('message_reaction', (data) => {
            this.handleMessageReaction(data);
        });

        // Typing events
        this.socket.on('user_typing', (data) => {
            this.handleUserTyping(data);
        });

        this.socket.on('user_stopped_typing', (data) => {
            this.handleUserStoppedTyping(data);
        });

        // User status events
        this.socket.on('user_status_changed', (data) => {
            this.handleUserStatusChanged(data);
        });

        // Mention events
        this.socket.on('mentioned', (data) => {
            this.handleMention(data);
        });
    }

    authenticateUser() {
        // Get user data from PHP session or global variable
        let userId = null;
        
        console.log('Attempting authentication...');
        console.log('window.currentUser:', window.currentUser);
        console.log('sessionStorage userId:', sessionStorage.getItem('userId'));
        
        // Try to get from global window variable (set by PHP)
        if (window.currentUser && window.currentUser.id) {
            userId = window.currentUser.id;
            console.log('Using window.currentUser.id:', userId);
        } 
        // Try to get from session storage
        else if (sessionStorage.getItem('userId')) {
            userId = sessionStorage.getItem('userId');
            console.log('Using sessionStorage userId:', userId);
        }
        
        if (userId) {
            console.log('Authenticating user:', userId);
            this.socket.emit('authenticate', {
                userId: parseInt(userId),
                username: window.currentUser?.username || 'Unknown',
                timestamp: Date.now()
            });
        } else {
            console.error('No user ID found for authentication');
            console.log('Attempting to fetch user data from server...');
            // Try to get user data from server
            this.fetchUserData();
        }
    }

    async fetchUserData() {
        try {
            // Try different API endpoints
            const possibleEndpoints = [
                'api/user.php?action=current',
                '../user-server/api/user.php?action=getCurrentUser',
                '/user/user-server/api/user.php?action=getCurrentUser'
            ];
            
            for (let endpoint of possibleEndpoints) {
                try {
                    console.log(`Trying API endpoint: ${endpoint}`);
                    const response = await fetch(endpoint);
                    const data = await response.json();
                    
                    console.log(`Response from ${endpoint}:`, data);
                    
                    if (data.user) {
                        window.currentUser = {
                            id: data.user.id,
                            username: data.user.username
                        };
                        sessionStorage.setItem('userId', data.user.id);
                        console.log('Successfully fetched user data:', window.currentUser);
                        this.authenticateUser();
                        return;
                    }
                } catch (err) {
                    console.log(`Failed to fetch from ${endpoint}:`, err.message);
                    continue;
                }
            }
            
            console.error('All API endpoints failed - using fallback');
            // Fallback: try to authenticate with a demo user ID
            window.currentUser = { id: 1, username: 'demo_user' };
            sessionStorage.setItem('userId', '1');
            this.authenticateUser();
            
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    }

    // Room management
    joinRoom(roomId) {
        if (this.currentRoom) {
            this.socket.emit('leave_room', this.currentRoom);
        }
        this.currentRoom = roomId;
        this.socket.emit('join_room', roomId);
    }

    leaveRoom(roomId) {
        this.socket.emit('leave_room', roomId);
        if (this.currentRoom === roomId) {
            this.currentRoom = null;
        }
    }

    // Message operations
    sendMessage(roomId, content, replyTo = null) {
        this.socket.emit('send_message', {
            room_id: roomId,
            content: content,
            reply_to: replyTo
        });
    }

    editMessage(messageId, content) {
        this.socket.emit('edit_message', {
            message_id: messageId,
            content: content
        });
    }

    deleteMessage(messageId) {
        this.socket.emit('delete_message', {
            message_id: messageId
        });
    }

    reactToMessage(messageId, emoji) {
        this.socket.emit('react_to_message', {
            message_id: messageId,
            emoji: emoji
        });
    }

    // Typing indicators
    startTyping(roomId) {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        this.socket.emit('typing', { room_id: roomId });

        this.typingTimeout = setTimeout(() => {
            this.stopTyping(roomId);
        }, 3000);
    }

    stopTyping(roomId) {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
        this.socket.emit('stop_typing', { room_id: roomId });
    }

    // User status
    updateUserStatus(status) {
        this.socket.emit('update_status', { status: status });
    }

    // Event handlers
    handleFriendRequestReceived(data) {
        // Show notification
        this.showNotification('Friend Request', `${data.username} sent you a friend request`, 'friend-request');
        
        // Update pending requests count
        window.friendsManager?.loadPendingRequests();
    }

    handleFriendRequestAccepted(data) {
        this.showNotification('Friend Request Accepted', `${data.username} accepted your friend request`, 'friend-accepted');
        
        // Update friends lists
        window.friendsManager?.loadAllFriends();
        window.friendsManager?.loadOnlineFriends();
        window.friendsManager?.loadPendingRequests();
    }

    handleNewMessage(data) {
        if (data.room_id === this.currentRoom) {
            // Add message to current chat
            window.chatManager?.addMessage(data.message);
        } else {
            // Update conversation list with new message
            window.chatManager?.updateConversationList();
            
            // Show notification if mentioned
            if (data.message.content.includes(`@${this.currentUser?.username}`)) {
                this.showNotification('Mentioned', `${data.message.username}: ${data.message.content}`, 'mention');
            }
        }
    }

    handleMessageEdited(data) {
        if (data.room_id === this.currentRoom) {
            window.chatManager?.updateMessage(data.message);
        }
    }

    handleMessageDeleted(data) {
        if (data.room_id === this.currentRoom) {
            window.chatManager?.removeMessage(data.message_id);
        }
    }

    handleMessageReaction(data) {
        if (data.room_id === this.currentRoom) {
            window.chatManager?.updateMessageReactions(data.message_id, data.reactions);
        }
    }

    handleUserTyping(data) {
        if (data.room_id === this.currentRoom && data.user_id !== this.currentUser?.id) {
            this.typingUsers.add(data.username);
            this.updateTypingIndicator();
        }
    }

    handleUserStoppedTyping(data) {
        if (data.room_id === this.currentRoom) {
            this.typingUsers.delete(data.username);
            this.updateTypingIndicator();
        }
    }

    handleUserStatusChanged(data) {
        // Update user status in friends list and active users
        window.friendsManager?.updateUserStatus(data.user_id, data.status);
        window.homeManager?.updateActiveUsers();
    }

    handleMention(data) {
        this.showNotification('Mentioned', `${data.username} mentioned you in ${data.room_name}`, 'mention');
    }

    updateTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        const typingText = document.getElementById('typingText');
        
        if (this.typingUsers.size === 0) {
            typingIndicator.classList.add('hidden');
        } else {
            const users = Array.from(this.typingUsers);
            let text = '';
            
            if (users.length === 1) {
                text = `${users[0]} is typing...`;
            } else if (users.length === 2) {
                text = `${users[0]} and ${users[1]} are typing...`;
            } else {
                text = `${users[0]} and ${users.length - 1} others are typing...`;
            }
            
            typingText.textContent = text;
            typingIndicator.classList.remove('hidden');
        }
    }

    showNotification(title, message, type = 'info') {
        // Check if notifications are supported and permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/assets/images/icon.png'
            });
        }
        
        // Also show in-app notification
        this.showInAppNotification(title, message, type);
    }

    showInAppNotification(title, message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to notification container
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Add close functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Request notification permission
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Initialize socket client
window.socketClient = new SocketClient();

// Request notification permission on load
document.addEventListener('DOMContentLoaded', () => {
    window.socketClient.requestNotificationPermission();
});