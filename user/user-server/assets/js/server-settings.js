// Server Settings Modal Functionality
class ServerSettingsManager {
    constructor() {
        this.currentServer = null;
        this.apiBaseUrl = 'api'; // Use relative path instead of absolute URL
        this.init();
    }

    // Helper method for API calls
    apiUrl(endpoint) {
        return `${this.apiBaseUrl}/${endpoint}`;
    }

    init() {
        this.bindEventListeners();
        this.initializeFormValidation();
    }

    bindEventListeners() {
        // Tab switching
        const settingsNavItems = document.querySelectorAll('#serverSettingsModal .settings-nav-item');
        settingsNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.settings-nav-item').dataset.tab);
            });
        });

        // File upload handlers
        const serverIconInput = document.getElementById('serverIconSettingsInput');
        const serverBannerInput = document.getElementById('serverBannerSettingsInput');
        
        if (serverIconInput) {
            serverIconInput.addEventListener('change', (e) => this.handleServerIconUpload(e));
        }
        if (serverBannerInput) {
            serverBannerInput.addEventListener('change', (e) => this.handleServerBannerUpload(e));
        }

        // Form change handlers
        const serverNameInput = document.getElementById('serverNameSettings');
        const serverDescriptionInput = document.getElementById('serverDescriptionSettings');
        const serverCategorySelect = document.getElementById('serverCategorySettings');

        if (serverNameInput) {
            serverNameInput.addEventListener('input', () => this.showSaveButton('saveServerNameBtn'));
        }
        if (serverDescriptionInput) {
            serverDescriptionInput.addEventListener('input', () => {
                this.updateDescriptionCount();
                this.showSaveButton('saveServerDescriptionBtn');
            });
        }
        if (serverCategorySelect) {
            serverCategorySelect.addEventListener('change', () => this.showSaveButton('saveServerCategoryBtn'));
        }

        // Delete server confirmation
        const deleteServerInput = document.getElementById('deleteServerConfirmation');
        if (deleteServerInput) {
            deleteServerInput.addEventListener('input', () => this.validateDeleteInput());
        }

        // Channel management controls
        const channelSearchInput = document.getElementById('channelSearchInput');
        const channelTypeFilter = document.getElementById('channelTypeFilter');
        
        if (channelSearchInput) {
            channelSearchInput.addEventListener('input', () => this.filterChannels());
        }
        if (channelTypeFilter) {
            channelTypeFilter.addEventListener('change', () => this.filterChannels());
        }

        // Member management controls
        const memberSearchInput = document.getElementById('memberSearchInput');
        const memberRoleFilter = document.getElementById('memberRoleFilter');
        
        if (memberSearchInput) {
            memberSearchInput.addEventListener('input', () => this.filterMembers());
        }
        if (memberRoleFilter) {
            memberRoleFilter.addEventListener('change', () => this.filterMembers());
        }
    }

    switchTab(tabName) {
        console.log('switchTab called with:', tabName);
        
        // Remove active class from all nav items and tabs
        document.querySelectorAll('#serverSettingsModal .settings-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('#serverSettingsModal .settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to selected nav item and tab
        const navItem = document.querySelector(`#serverSettingsModal .settings-nav-item[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}Tab`);
        
        console.log('Found nav item:', navItem);
        console.log('Found tab content:', tabContent);
        console.log('Looking for tab ID:', `${tabName}Tab`);
        
        if (navItem) navItem.classList.add('active');
        if (tabContent) {
            tabContent.classList.add('active');
            console.log('Tab content activated');
        } else {
            console.error('Tab content not found for:', `${tabName}Tab`);
        }

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch (tabName) {
            case 'server-profile':
                this.loadServerProfile();
                break;
            case 'channel-management':
                this.loadChannelManagement();
                break;
            case 'members':
                this.loadMemberManagement();
                break;
            case 'delete-server':
                this.loadDeleteServerTab();
                break;
        }
    }

    async loadServerData(server) {
        console.log('loadServerData called with:', server);
        this.currentServer = server;
        
        if (!server) {
            console.error('No server data provided to loadServerData');
            return;
        }

        if (!server.ID) {
            console.error('Server data missing ID:', server);
            return;
        }

        console.log('Setting currentServer to:', this.currentServer);

        // Update modal title
        const titleElement = document.getElementById('serverSettingsTitle');
        if (titleElement) {
            titleElement.textContent = `${server.Name} Settings`;
        }

        // Load the current tab data
        const activeTab = document.querySelector('#serverSettingsModal .settings-nav-item.active')?.dataset.tab || 'server-profile';
        this.loadTabData(activeTab);
    }

    async loadServerProfile() {
        if (!this.currentServer) return;

        try {
            // Update preview elements
            const serverNamePreview = document.getElementById('serverNamePreview');
            const serverDescriptionPreview = document.getElementById('serverDescriptionPreview');
            const serverIconPreview = document.getElementById('serverIconSettingsPreview');
            const serverBannerPreview = document.getElementById('serverBannerSettingsPreview');

            if (serverNamePreview) serverNamePreview.textContent = this.currentServer.Name || 'Unnamed Server';
            if (serverDescriptionPreview) serverDescriptionPreview.textContent = this.currentServer.Description || 'No description';

            // Update form inputs
            const serverNameInput = document.getElementById('serverNameSettings');
            const serverDescriptionInput = document.getElementById('serverDescriptionSettings');
            const serverCategorySelect = document.getElementById('serverCategorySettings');

            if (serverNameInput) serverNameInput.value = this.currentServer.Name || '';
            if (serverDescriptionInput) {
                serverDescriptionInput.value = this.currentServer.Description || '';
                this.updateDescriptionCount();
            }
            if (serverCategorySelect) serverCategorySelect.value = this.currentServer.Category || 'Gaming';

            // Update preview images
            if (serverIconPreview && this.currentServer.IconServer) {
                serverIconPreview.style.backgroundImage = `url(${this.currentServer.IconServer})`;
            }
            if (serverBannerPreview && this.currentServer.BannerServer) {
                serverBannerPreview.style.backgroundImage = `url(${this.currentServer.BannerServer})`;
            }

        } catch (error) {
            console.error('Error loading server profile:', error);
            this.showToast('Failed to load server profile', 'error');
        }
    }

    async loadChannelManagement() {
        console.log('loadChannelManagement called');
        if (!this.currentServer) {
            console.error('No current server available for loading channels');
            return;
        }

        try {
            console.log('Fetching channels for server ID:', this.currentServer.ID);
            const response = await fetch(this.apiUrl(`channels.php?action=getChannels&serverId=${this.currentServer.ID}`));
            console.log('Channel fetch response:', response);
            
            const data = await response.json();
            console.log('Channel data received:', data);

            if (data.success) {
                this.renderChannelsTable(data.channels);
            } else {
                console.error('Failed to load channels:', data.error);
                const tableBody = document.getElementById('channelsTableBody');
                if (tableBody) {
                    tableBody.innerHTML = '<div class="no-data">Failed to load channels: ' + (data.error || 'Unknown error') + '</div>';
                }
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            const tableBody = document.getElementById('channelsTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<div class="no-data">Error loading channels: ' + error.message + '</div>';
            }
        }
    }

    async loadMemberManagement() {
        if (!this.currentServer) return;

        try {
            const response = await fetch(this.apiUrl(`servers.php?action=getServerMembers&serverId=${this.currentServer.ID}`));
            const data = await response.json();

            if (data.success) {
                this.renderMembersTable(data.members);
            } else {
                console.error('Failed to load members:', data.error);
            }
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }

    loadDeleteServerTab() {
        const deleteInput = document.getElementById('deleteServerConfirmation');
        if (deleteInput) {
            deleteInput.value = '';
            this.validateDeleteInput();
        }
    }

    handleServerIconUpload(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('Server icon upload started for file:', file.name);
            this.uploadServerImage(file, 'server_icon');
        }
        event.target.value = '';
    }

    handleServerBannerUpload(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('Server banner upload started for file:', file.name);
            this.uploadServerImage(file, 'server_banner');
        }
        event.target.value = '';
    }

    async uploadServerImage(file, type) {
        console.log(`Starting ${type} upload for file:`, file.name, 'Size:', file.size);
        
        // Check if current server is available
        if (!this.currentServer || !this.currentServer.ID) {
            console.error('Current server not available for upload:', this.currentServer);
            this.showToast('Error: No server selected. Please try opening the settings again.', 'error');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showToast('Image file size must be less than 10MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('image_type', type);
        formData.append('action', 'uploadServerImage');
        formData.append('server_id', this.currentServer.ID);

        try {
            const response = await fetch(this.apiUrl('servers.php'), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            if (!responseText.trim()) {
                throw new Error('Empty response from server');
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', responseText);
                throw new Error('Invalid JSON response from server');
            }

            if (data.success) {
                this.showToast(`${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} updated successfully!`, 'success');
                
                // Update preview
                const previewElement = type === 'server_icon' 
                    ? document.getElementById('serverIconSettingsPreview')
                    : document.getElementById('serverBannerSettingsPreview');
                
                if (previewElement && data.image_url) {
                    previewElement.style.backgroundImage = `url(${data.image_url})`;
                }

                // Update current server data
                if (type === 'server_icon') {
                    this.currentServer.IconServer = data.image_url;
                } else {
                    this.currentServer.BannerServer = data.image_url;
                }
            } else {
                console.error(`Upload failed for ${type}:`, data);
                this.showToast(data.error || `Failed to upload ${type}`, 'error');
            }
        } catch (error) {
            console.error(`Error uploading ${type}:`, error);
            this.showToast(`Failed to upload ${type}: ${error.message}`, 'error');
        }
    }

    async saveServerName() {
        if (!this.currentServer || !this.currentServer.ID) {
            this.showToast('Error: No server selected. Please try opening the settings again.', 'error');
            return;
        }

        const serverNameInput = document.getElementById('serverNameSettings');
        const serverName = serverNameInput.value.trim();
        
        if (!serverName) {
            this.showToast('Server name is required', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'updateServerName');
            formData.append('server_id', this.currentServer.ID);
            formData.append('name', serverName);

            const response = await fetch(this.apiUrl('servers.php'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Server name updated successfully', 'success');
                this.currentServer.Name = serverName;
                document.getElementById('serverNamePreview').textContent = serverName;
                this.hideSaveButton('saveServerNameBtn');
            } else {
                this.showToast(data.error || 'Failed to update server name', 'error');
            }
        } catch (error) {
            console.error('Error updating server name:', error);
            this.showToast('Failed to update server name', 'error');
        }
    }

    async saveServerDescription() {
        if (!this.currentServer || !this.currentServer.ID) {
            this.showToast('Error: No server selected. Please try opening the settings again.', 'error');
            return;
        }

        const serverDescriptionInput = document.getElementById('serverDescriptionSettings');
        const serverDescription = serverDescriptionInput.value.trim();

        try {
            const formData = new FormData();
            formData.append('action', 'updateServerDescription');
            formData.append('server_id', this.currentServer.ID);
            formData.append('description', serverDescription);

            const response = await fetch(this.apiUrl('servers.php'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Server description updated successfully', 'success');
                this.currentServer.Description = serverDescription;
                document.getElementById('serverDescriptionPreview').textContent = serverDescription || 'No description';
                this.hideSaveButton('saveServerDescriptionBtn');
            } else {
                this.showToast(data.error || 'Failed to update server description', 'error');
            }
        } catch (error) {
            console.error('Error updating server description:', error);
            this.showToast('Failed to update server description', 'error');
        }
    }

    async saveServerCategory() {
        if (!this.currentServer || !this.currentServer.ID) {
            this.showToast('Error: No server selected. Please try opening the settings again.', 'error');
            return;
        }

        const serverCategorySelect = document.getElementById('serverCategorySettings');
        const serverCategory = serverCategorySelect.value;

        try {
            const formData = new FormData();
            formData.append('action', 'updateServerCategory');
            formData.append('server_id', this.currentServer.ID);
            formData.append('category', serverCategory);

            const response = await fetch(this.apiUrl('servers.php'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Server category updated successfully', 'success');
                this.currentServer.Category = serverCategory;
                this.hideSaveButton('saveServerCategoryBtn');
            } else {
                this.showToast(data.error || 'Failed to update server category', 'error');
            }
        } catch (error) {
            console.error('Error updating server category:', error);
            this.showToast('Failed to update server category', 'error');
        }
    }

    async deleteServer() {
        if (!this.currentServer || !this.currentServer.ID) {
            this.showToast('Error: No server selected. Please try opening the settings again.', 'error');
            return;
        }

        const deleteInput = document.getElementById('deleteServerConfirmation');
        if (!deleteInput || deleteInput.value.trim() !== this.currentServer.Name) {
            this.showToast('Please type the exact server name to confirm deletion', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'deleteServer');
            formData.append('serverId', this.currentServer.ID);
            formData.append('confirmation', deleteInput.value.trim());

            const response = await fetch(this.apiUrl('servers.php'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Server deleted successfully', 'success');
                // Redirect to dashboard after successful deletion
                setTimeout(() => {
                    window.location.href = '../home/index.php';
                }, 2000);
            } else {
                this.showToast(data.error || 'Failed to delete server', 'error');
            }
        } catch (error) {
            console.error('Error deleting server:', error);
            this.showToast('Failed to delete server', 'error');
        }
    }

    // Channel Management Methods
    editChannel(channelId, channelName, channelType) {
        console.log('editChannel called:', { channelId, channelName, channelType });
        
        // Populate the edit modal
        document.getElementById('editChannelName').value = channelName;
        document.getElementById('editChannelId').value = channelId;
        
        // Set the channel prefix based on type
        const prefix = document.getElementById('editChannelPrefix');
        if (prefix) {
            prefix.textContent = channelType === 'voice' ? '🔊' : '#';
        }
        
        // Show the modal
        document.getElementById('editChannelModal').classList.remove('hidden');
    }

    deleteChannel(channelId, channelName) {
        console.log('deleteChannel called:', { channelId, channelName });
        
        if (!confirm(`Are you sure you want to delete channel "${channelName}"? This action cannot be undone.`)) {
            return;
        }

        this.performDeleteChannel(channelId, channelName);
    }

    async performDeleteChannel(channelId, channelName) {
        try {
            const formData = new FormData();
            formData.append('action', 'deleteChannel');
            formData.append('channelId', channelId);

            const response = await fetch(this.apiUrl('channels.php'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(`Channel "${channelName}" deleted successfully`, 'success');
                // Reload channels
                this.loadChannelManagement();
            } else {
                this.showToast(data.error || 'Failed to delete channel', 'error');
            }
        } catch (error) {
            console.error('Error deleting channel:', error);
            this.showToast('Failed to delete channel', 'error');
        }
    }

    async saveChannelEdit() {
        const channelId = document.getElementById('editChannelId').value;
        const channelName = document.getElementById('editChannelName').value.trim();
        
        if (!channelName) {
            this.showToast('Channel name is required', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'updateChannel');
            formData.append('channelId', channelId);
            formData.append('name', channelName);

            const response = await fetch(this.apiUrl('channels.php'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Channel updated successfully', 'success');
                document.getElementById('editChannelModal').classList.add('hidden');
                // Reload channels
                this.loadChannelManagement();
            } else {
                this.showToast(data.error || 'Failed to update channel', 'error');
            }
        } catch (error) {
            console.error('Error updating channel:', error);
            this.showToast('Failed to update channel', 'error');
        }
    }

    // Filter and Search Methods
    filterChannels() {
        const searchTerm = document.getElementById('channelSearchInput').value.toLowerCase();
        const typeFilter = document.getElementById('channelTypeFilter').value;
        
        console.log('Filtering channels:', { searchTerm, typeFilter });
        
        const rows = document.querySelectorAll('#channelsTableBody .table-row');
        rows.forEach(row => {
            const channelName = row.querySelector('.channel-info span').textContent.toLowerCase();
            const channelType = row.querySelector('.channel-type').textContent.toLowerCase();
            
            const matchesSearch = channelName.includes(searchTerm);
            const matchesType = typeFilter === 'all' || channelType === typeFilter;
            
            row.style.display = (matchesSearch && matchesType) ? 'flex' : 'none';
        });
    }

    filterMembers() {
        const searchTerm = document.getElementById('memberSearchInput').value.toLowerCase();
        const roleFilter = document.getElementById('memberRoleFilter').value;
        
        console.log('Filtering members:', { searchTerm, roleFilter });
        
        const rows = document.querySelectorAll('#membersTableBody .table-row');
        rows.forEach(row => {
            const memberName = row.querySelector('.member-name').textContent.toLowerCase();
            const memberUsername = row.querySelector('.member-username').textContent.toLowerCase();
            const memberRole = row.querySelector('.member-role').textContent;
            
            const matchesSearch = memberName.includes(searchTerm) || memberUsername.includes(searchTerm);
            const matchesRole = roleFilter === 'all' || memberRole === roleFilter;
            
            row.style.display = (matchesSearch && matchesRole) ? 'flex' : 'none';
        });
    }

    // Member Management Methods
    changeMemberRole(userId, newRole) {
        console.log('changeMemberRole called:', { userId, newRole });
        
        if (!confirm(`Are you sure you want to change this member's role to ${newRole}?`)) {
            return;
        }

        this.performChangeMemberRole(userId, newRole);
    }

    async performChangeMemberRole(userId, newRole) {
        try {
            const formData = new FormData();
            formData.append('action', 'changeMemberRole');
            formData.append('serverId', this.currentServer.ID);
            formData.append('userId', userId);
            formData.append('role', newRole);

            const response = await fetch(this.apiUrl('servers.php'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(`Member role changed to ${newRole} successfully`, 'success');
                // Reload members
                this.loadMemberManagement();
            } else {
                this.showToast(data.error || 'Failed to change member role', 'error');
            }
        } catch (error) {
            console.error('Error changing member role:', error);
            this.showToast('Failed to change member role', 'error');
        }
    }

    kickMember(userId, username) {
        console.log('kickMember called:', { userId, username });
        
        if (!confirm(`Are you sure you want to kick "${username}" from the server?`)) {
            return;
        }

        this.performKickMember(userId, username);
    }

    async performKickMember(userId, username) {
        try {
            const formData = new FormData();
            formData.append('action', 'kickMember');
            formData.append('serverId', this.currentServer.ID);
            formData.append('userId', userId);

            const response = await fetch(this.apiUrl('servers.php'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(`${username} has been kicked from the server`, 'success');
                // Reload members
                this.loadMemberManagement();
            } else {
                this.showToast(data.error || 'Failed to kick member', 'error');
            }
        } catch (error) {
            console.error('Error kicking member:', error);
            this.showToast('Failed to kick member', 'error');
        }
    }

    renderChannelsTable(channels) {
        const tableBody = document.getElementById('channelsTableBody');
        if (!tableBody) return;

        if (channels.length === 0) {
            tableBody.innerHTML = '<div class="no-data">No channels found</div>';
            return;
        }

        const channelsHtml = channels.map(channel => `
            <div class="table-row">
                <div class="table-cell">
                    <div class="channel-info">
                        <i class="fas ${channel.Type === 'voice' ? 'fa-volume-up' : 'fa-hashtag'}"></i>
                        <span>${channel.Name}</span>
                    </div>
                </div>
                <div class="table-cell">
                    <span class="channel-type">${channel.Type}</span>
                </div>
                <div class="table-cell">
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="serverSettingsManager.editChannel(${channel.ID}, '${channel.Name}', '${channel.Type}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="serverSettingsManager.deleteChannel(${channel.ID}, '${channel.Name}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        tableBody.innerHTML = channelsHtml;
    }

    renderMembersTable(members) {
        const tableBody = document.getElementById('membersTableBody');
        if (!tableBody) return;

        if (members.length === 0) {
            tableBody.innerHTML = '<div class="no-data">No members found</div>';
            return;
        }

        const membersHtml = members.map(member => `
            <div class="table-row">
                <div class="table-cell">
                    <div class="member-info">
                        <img src="${member.ProfilePictureUrl || '/assets/images/default-avatar.png'}" class="member-avatar" alt="${member.Username}">
                        <div class="member-details">
                            <span class="member-name">${member.DisplayName || member.Username}</span>
                            <span class="member-username">@${member.Username}</span>
                        </div>
                    </div>
                </div>
                <div class="table-cell">
                    <span class="member-role ${member.Role.toLowerCase()}">${member.Role}</span>
                </div>
                <div class="table-cell">
                    <span class="member-joined">${this.formatDate(member.JoinedAt)}</span>
                </div>
                <div class="table-cell">
                    <div class="action-buttons">
                        ${this.getMemberActionButtons(member)}
                    </div>
                </div>
            </div>
        `).join('');

        tableBody.innerHTML = membersHtml;
    }

    getMemberActionButtons(member) {
        // Only show actions if current user is owner or admin
        const currentUserRole = this.getCurrentUserRole();
        if (currentUserRole !== 'Owner' && currentUserRole !== 'Admin') {
            return '';
        }

        let buttons = '';

        // Role management (only owners can change roles)
        if (currentUserRole === 'Owner' && member.Role !== 'Owner') {
            if (member.Role === 'Admin') {
                buttons += `<button class="btn-sm btn-secondary" onclick="serverSettingsManager.changeMemberRole(${member.UserID}, 'Member')" title="Demote to Member">Demote</button>`;
            } else if (member.Role === 'Member') {
                buttons += `<button class="btn-sm btn-primary" onclick="serverSettingsManager.changeMemberRole(${member.UserID}, 'Admin')" title="Promote to Admin">Promote</button>`;
            }
        }

        // Kick member (owners and admins can kick members, but not other owners/admins)
        if (member.Role === 'Member' || (currentUserRole === 'Owner' && member.Role === 'Admin')) {
            buttons += `<button class="btn-sm btn-danger" onclick="serverSettingsManager.kickMember(${member.UserID}, '${member.Username}')" title="Kick Member">Kick</button>`;
        }

        return buttons;
    }

    getCurrentUserRole() {
        // This should be implemented to get the current user's role in the server
        // For now, we'll assume they have access to the settings (Owner or Admin)
        return 'Owner'; // Placeholder
    }

    showSaveButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('hidden');
        }
    }

    hideSaveButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('hidden');
        }
    }

    updateDescriptionCount() {
        const descriptionInput = document.getElementById('serverDescriptionSettings');
        const countElement = document.getElementById('serverDescriptionCount');
        
        if (descriptionInput && countElement) {
            countElement.textContent = descriptionInput.value.length;
        }
    }

    validateDeleteInput() {
        const deleteInput = document.getElementById('deleteServerConfirmation');
        const deleteButton = document.getElementById('deleteServerBtn');
        
        if (deleteInput && deleteButton && this.currentServer) {
            const isValid = deleteInput.value.trim() === this.currentServer.Name;
            deleteButton.disabled = !isValid;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    showToast(message, type = 'info') {
        // Use the existing toast system from serverApp if available
        if (window.serverApp && window.serverApp.showToast) {
            window.serverApp.showToast(message, type);
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    initializeFormValidation() {
        // Add any form validation logic here
    }
}

// Global functions called by the modal
function editServerBanner() {
    document.getElementById('serverBannerSettingsInput').click();
}

function editServerIcon() {
    document.getElementById('serverIconSettingsInput').click();
}

function saveServerName() {
    if (window.serverSettingsManager) {
        window.serverSettingsManager.saveServerName();
    }
}

function saveServerDescription() {
    if (window.serverSettingsManager) {
        window.serverSettingsManager.saveServerDescription();
    }
}

function saveServerCategory() {
    if (window.serverSettingsManager) {
        window.serverSettingsManager.saveServerCategory();
    }
}

function deleteServer() {
    if (window.serverSettingsManager) {
        window.serverSettingsManager.deleteServer();
    }
}

function closeEditChannelModal() {
    document.getElementById('editChannelModal').classList.add('hidden');
}

function saveChannelEdit() {
    if (window.serverSettingsManager) {
        window.serverSettingsManager.saveChannelEdit();
    }
}

function closeTransferOwnershipModal() {
    document.getElementById('transferOwnershipModal').classList.add('hidden');
}

function confirmOwnershipTransfer() {
    if (window.serverSettingsManager) {
        window.serverSettingsManager.confirmOwnershipTransfer();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.serverSettingsManager = new ServerSettingsManager();
});

// Create the serverSettings object for backward compatibility
window.serverSettings = {
    loadServerData: (server) => {
        console.log('loadServerData called with server:', server);
        if (window.serverSettingsManager) {
            window.serverSettingsManager.loadServerData(server);
        } else {
            console.error('serverSettingsManager not initialized yet');
            // Try to initialize if not already done
            window.serverSettingsManager = new ServerSettingsManager();
            window.serverSettingsManager.loadServerData(server);
        }
    },
    initializeLeaveServerModal: (server) => {
        // This can be implemented if needed
        console.log('Initialize leave server modal for:', server);
    }
};
