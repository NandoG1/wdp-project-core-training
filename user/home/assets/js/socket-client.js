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
        this.socket = io('http://localhost:8010', {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            timeout: 20000
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
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
        this.socket.on('authenticated', (userData) => {
            console.log('Successfully authenticated:', userData);
            this.currentUser = userData;
            this.updateUserStatus('online');
        });

        this.socket.on('authentication_failed', (data) => {
            console.error('Authentication failed:', data.message);
        });
        this.socket.on('friend_request_received', (data) => {
            this.handleFriendRequestReceived(data);
        });

        this.socket.on('friend_request_accepted', (data) => {
            this.handleFriendRequestAccepted(data);
        });
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
        this.socket.on('user_typing', (data) => {
            this.handleUserTyping(data);
        });

        this.socket.on('user_stopped_typing', (data) => {
            this.handleUserStoppedTyping(data);
        });
        this.socket.on('user_status_changed', (data) => {
            this.handleUserStatusChanged(data);
        });
        this.socket.on('mentioned', (data) => {
            this.handleMention(data);
        });
    }

    authenticateUser() {
        let userId = null;
        
        console.log('Attempting authentication...');
        console.log('window.currentUser:', window.currentUser);
        console.log('sessionStorage userId:', sessionStorage.getItem('userId'));
        if (window.currentUser && window.currentUser.id) {
            userId = window.currentUser.id;
            console.log('Using window.currentUser.id:', userId);
        } 
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
            this.fetchUserData();
        }
    }

    async fetchUserData() {
        try {
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
            window.currentUser = { id: 1, username: 'demo_user' };
            sessionStorage.setItem('userId', '1');
            this.authenticateUser();
            
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    }
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
    updateUserStatus(status) {
        this.socket.emit('update_status', { status: status });
    }
    handleFriendRequestReceived(data) {
        this.showNotification('Friend Request', `${data.username} sent you a friend request`, 'friend-request');
        window.friendsManager?.loadPendingRequests();
    }

    handleFriendRequestAccepted(data) {
        this.showNotification('Friend Request Accepted', `${data.username} accepted your friend request`, 'friend-accepted');
        window.friendsManager?.loadAllFriends();
        window.friendsManager?.loadOnlineFriends();
        window.friendsManager?.loadPendingRequests();
    }

    handleNewMessage(data) {
        if (data.room_id === this.currentRoom) {
            window.chatManager?.addMessage(data.message);
        } else {
            window.chatManager?.updateConversationList();
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
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/assets/images/icon.png'
            });
        }
        this.showInAppNotification(title, message, type);
    }

    showInAppNotification(title, message, type) {
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
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
window.socketClient = new SocketClient();
document.addEventListener('DOMContentLoaded', () => {
    window.socketClient.requestNotificationPermission();
});