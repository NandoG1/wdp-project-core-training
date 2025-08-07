class HomeManager {
    constructor() {
        this.currentUser = null;
        this.activeUsers = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrentUser();
        this.loadActiveUsers();
        setInterval(() => {
            this.loadActiveUsers();
        }, 30000);
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchMainTab(tabName);
            });
        });
        document.getElementById('conversationSearch')?.addEventListener('input', (e) => {
            this.searchConversations(e.target.value);
        });
        document.querySelectorAll('.user-controls .control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleUserControl(e.target.closest('.control-btn'));
            });
        });
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/user/home/api/user.php?action=current');
            const data = await response.json();
            
            if (data.user) {
                this.currentUser = data.user;
                this.updateUserInfo(data.user);
            }
        } catch (error) {
            console.error('Error loading current user:', error);
            this.currentUser = {
                id: 1,
                username: 'user',
                discriminator: '0001',
                display_name: 'User',
                avatar: null,
                status: 'online'
            };
            this.updateUserInfo(this.currentUser);
        }
    }

    updateUserInfo(user) {
        document.getElementById('currentUsername').textContent = user.username;
        document.getElementById('currentDiscriminator').textContent = `#${user.discriminator}`;
        document.getElementById('currentUserAvatar').src = user.avatar || '/assets/images/default-avatar.png';
        document.getElementById('panelUsername').textContent = user.username;
        document.getElementById('panelDiscriminator').textContent = `#${user.discriminator}`;
        document.getElementById('panelUserAvatar').src = user.avatar || '/assets/images/default-avatar.png';
        if (window.socketClient) {
            window.socketClient.currentUser = user;
        }
    }

    async loadActiveUsers() {
        try {
            const response = await fetch('/user/home/api/chat.php?action=active_users');
            const data = await response.json();
            
            if (data.active_users) {
                this.activeUsers = data.active_users;
                this.renderActiveUsers(data.active_users);
            }
        } catch (error) {
            console.error('Error loading active users:', error);
        }
    }

    renderActiveUsers(users) {
        const container = document.getElementById('activeNowList');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No friends online right now.</p></div>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="active-user" data-user-id="${user.id}" onclick="window.homeManager.startChatWithUser(${user.id})">
                <div class="active-user-avatar">
                    <img src="${user.avatar || '/assets/images/default-avatar.png'}" alt="${user.display_name}">
                    <div class="status-indicator status-${user.status}"></div>
                </div>
                <div class="active-user-info">
                    <div class="active-user-name">${user.display_name}</div>
                    <div class="active-user-status">
                        <i class="fas fa-circle status-${user.status}"></i>
                        ${this.getStatusText(user.status)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async startChatWithUser(userId) {
        try {
            const response = await fetch('/user/home/api/chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_dm',
                    user_ids: [parseInt(userId)]
                })
            });

            const data = await response.json();

            if (data.room_id) {
                window.chatManager?.openChat(data.room_id);
            } else {
                console.error('Failed to create direct message:', data.error);
            }
        } catch (error) {
            console.error('Error creating direct message:', error);
        }
    }

    switchMainTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        switch (tabName) {
            case 'friends':
                this.showFriendsSection();
                break;
            case 'nitro':
                this.showNitroSection();
                break;
        }
    }

    showFriendsSection() {
        window.chatManager?.showFriendsSection();
        if (window.friendsManager) {
            window.friendsManager.loadActiveTab();
        }
    }

    showNitroSection() {
        window.chatManager?.showFriendsSection();
        console.log('Nitro section not implemented yet');
    }

    searchConversations(query) {
        const dmItems = document.querySelectorAll('.dm-item');
        
        if (!query.trim()) {
            dmItems.forEach(item => {
                item.style.display = 'flex';
            });
            return;
        }

        const searchTerm = query.toLowerCase();
        
        dmItems.forEach(item => {
            const name = item.querySelector('.dm-name').textContent.toLowerCase();
            const lastMessage = item.querySelector('.dm-status').textContent.toLowerCase();
            
            const isVisible = name.includes(searchTerm) || lastMessage.includes(searchTerm);
            item.style.display = isVisible ? 'flex' : 'none';
        });
    }

    handleUserControl(button) {
        const title = button.getAttribute('title');
        
        switch (title) {
            case 'Mute':
                this.toggleMute();
                break;
            case 'Deafen':
                this.toggleDeafen();
                break;
            case 'Settings':
                this.openSettings();
                break;
        }
    }

    toggleMute() {
        const btn = document.querySelector('[title="Mute"]');
        const icon = btn.querySelector('i');
        
        if (icon.classList.contains('fa-microphone-slash')) {
            icon.className = 'fas fa-microphone';
            btn.title = 'Mute';
            btn.style.backgroundColor = '';
        } else {
            icon.className = 'fas fa-microphone-slash';
            btn.title = 'Unmute';
            btn.style.backgroundColor = 'var(--red-primary)';
        }
    }

    toggleDeafen() {
        const btn = document.querySelector('[title="Deafen"]');
        const icon = btn.querySelector('i');
        
        if (icon.classList.contains('fa-headphones-alt')) {
            icon.className = 'fas fa-headphones';
            btn.title = 'Deafen';
            btn.style.backgroundColor = '';
        } else {
            icon.className = 'fas fa-headphones-alt';
            btn.title = 'Undeafen';
            btn.style.backgroundColor = 'var(--red-primary)';
        }
    }

    openSettings() {
        console.log('Settings not implemented yet');
    }

    updateActiveUsers() {
        this.loadActiveUsers();
    }

    getStatusText(status) {
        switch (status) {
            case 'online':
                return 'Online';
            case 'away':
                return 'Away';
            case 'busy':
                return 'Do Not Disturb';
            case 'offline':
                return 'Offline';
            default:
                return 'Unknown';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
    showNotification(title, message, type = 'info', duration = 5000) {
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
            this.removeNotification(notification);
        });
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        return notification;
    }

    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.classList.add('notification-exit');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('conversationSearch')?.focus();
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                window.friendsManager?.switchTab('add');
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                window.chatManager?.showCreateDMModal();
            }
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                this.navigateConversations(e.key === 'ArrowUp' ? -1 : 1);
            }
        });
    }

    navigateConversations(direction) {
        const conversations = document.querySelectorAll('.dm-item:not([style*="display: none"])');
        const currentActive = document.querySelector('.dm-item.active');
        
        if (conversations.length === 0) return;

        let currentIndex = currentActive ? 
                          Array.from(conversations).indexOf(currentActive) : -1;
        
        currentIndex += direction;
        
        if (currentIndex < 0) {
            currentIndex = conversations.length - 1;
        } else if (currentIndex >= conversations.length) {
            currentIndex = 0;
        }

        const nextConversation = conversations[currentIndex];
        if (nextConversation) {
            const roomId = nextConversation.dataset.roomId;
            window.chatManager?.openChat(parseInt(roomId));
        }
    }
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.showNotification('Connection Restored', 'You are back online', 'success');
            this.handleReconnection();
        });

        window.addEventListener('offline', () => {
            this.showNotification('Connection Lost', 'You are offline', 'warning');
        });
    }

    handleReconnection() {
        this.loadActiveUsers();
        window.chatManager?.loadConversations();
        window.friendsManager?.loadActiveTab();
    }
    initializeApp() {
        this.loadTheme();
        this.setupKeyboardShortcuts();
        this.setupConnectionMonitoring();
        document.body.classList.add('app-ready');
    }
}
window.homeManager = new HomeManager();
document.addEventListener('DOMContentLoaded', () => {
    window.homeManager.initializeApp();
});