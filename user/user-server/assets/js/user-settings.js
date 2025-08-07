// User Settings Modal Functionality
class UserSettingsManager {
    constructor() {
        this.currentUser = null;
        this.isEmailRevealed = false;
        this.deviceStreams = {
            camera: null,
            microphone: null
        };
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.loadUserData();
        this.initializeFormValidation();
    }

    bindEventListeners() {
        // Settings navigation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.settings-nav-item')) {
                this.switchTab(e.target.closest('.settings-nav-item'));
            }
        });

        // Form change detection
        document.addEventListener('input', (e) => {
            if (e.target.closest('#accountForm')) {
                this.detectFormChanges();
            }
        });

        // Avatar and banner editing
        document.addEventListener('click', (e) => {
            if (e.target.closest('.avatar-edit-btn')) {
                this.editAvatar();
            }
            if (e.target.closest('.banner-edit-btn')) {
                this.editBanner();
            }
        });

        // Email reveal
        const revealBtn = document.getElementById('revealEmailBtn');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => this.toggleEmailReveal());
        }

        // About me character count
        const aboutMeField = document.getElementById('aboutMeField');
        if (aboutMeField) {
            aboutMeField.addEventListener('input', () => this.updateCharacterCount());
        }

        // Volume sliders
        document.addEventListener('input', (e) => {
            if (e.target.type === 'range' && e.target.id.includes('Volume')) {
                this.updateVolumeDisplay(e.target);
            }
        });

        // Device testing
        const micTestBtn = document.getElementById('micTestBtn');
        if (micTestBtn) {
            micTestBtn.addEventListener('click', () => this.startMicTest());
        }

        const cameraTestBtn = document.getElementById('testCameraBtn');
        if (cameraTestBtn) {
            cameraTestBtn.addEventListener('click', () => this.testCamera());
        }

        const stopCameraBtn = document.getElementById('stopCameraBtn');
        if (stopCameraBtn) {
            stopCameraBtn.addEventListener('click', () => this.stopCamera());
        }

        // Voice/Video subtabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchSubTab(e.target);
            }
        });

        // File inputs
        const avatarInput = document.getElementById('avatarInput');
        const bannerInput = document.getElementById('bannerInput');
        
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }
        if (bannerInput) {
            bannerInput.addEventListener('change', (e) => this.handleBannerUpload(e));
        }
    }

    async loadUserData() {
        try {
            const response = await fetch('api/user.php?action=getCurrentUser');
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.populateUserForm();
                this.loadSecurityQuestion();
            } else {
                console.error('Failed to load user data:', data.error);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    populateUserForm() {
        if (!this.currentUser) return;

        // Basic info
        document.getElementById('usernameField').value = this.currentUser.Username || '';
        document.getElementById('displayNameField').value = this.currentUser.DisplayName || '';
        document.getElementById('aboutMeField').value = this.currentUser.Bio || '';
        
        // Update character count
        this.updateCharacterCount();

        // User tag
        document.getElementById('userTag').textContent = `#${this.currentUser.Discriminator || '0000'}`;

        // Account preview
        document.getElementById('accountDisplayName').textContent = this.currentUser.DisplayName || this.currentUser.Username;
        document.getElementById('accountUsername').textContent = `${this.currentUser.Username}#${this.currentUser.Discriminator || '0000'}`;

        // Email (masked)
        const emailMasked = document.getElementById('emailMasked');
        if (emailMasked && this.currentUser.Email) {
            const maskedEmail = this.maskEmail(this.currentUser.Email);
            emailMasked.textContent = maskedEmail;
        }

        // Avatar
        const avatarPreview = document.getElementById('userAvatarPreview');
        if (avatarPreview && this.currentUser.ProfilePictureUrl) {
            avatarPreview.style.backgroundImage = `url(${this.currentUser.ProfilePictureUrl})`;
            avatarPreview.style.backgroundSize = 'cover';
            avatarPreview.style.backgroundPosition = 'center';
        }

        // Banner
        const bannerPreview = document.getElementById('userBannerPreview');
        if (bannerPreview && this.currentUser.BannerProfile) {
            bannerPreview.style.backgroundImage = `url(${this.currentUser.BannerProfile})`;
            bannerPreview.style.backgroundSize = 'cover';
            bannerPreview.style.backgroundPosition = 'center';
        }
    }

    maskEmail(email) {
        const [username, domain] = email.split('@');
        const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
        return `${maskedUsername}@${domain}`;
    }

    switchTab(navItem) {
        // Remove active from all nav items
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Hide all tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Activate clicked nav item
        navItem.classList.add('active');

        // Show corresponding tab
        const tabId = navItem.dataset.tab;
        const tab = document.getElementById(tabId + 'Tab');
        if (tab) {
            tab.classList.add('active');
        }

        // Load tab-specific data
        this.loadTabData(tabId);
    }

    switchSubTab(tabBtn) {
        // Remove active from all subtab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Hide all subtabs
        document.querySelectorAll('.settings-subtab').forEach(subtab => {
            subtab.classList.remove('active');
        });

        // Activate clicked button
        tabBtn.classList.add('active');

        // Show corresponding subtab
        const subtabId = tabBtn.dataset.subtab + 'Settings';
        const subtab = document.getElementById(subtabId);
        if (subtab) {
            subtab.classList.add('active');
        }
    }

    loadTabData(tabId) {
        switch (tabId) {
            case 'voice-video':
                this.loadAudioDevices();
                break;
            case 'delete-account':
                this.checkServerOwnership();
                break;
        }
    }

    detectFormChanges() {
        const saveBtn = document.getElementById('saveAccountBtn');
        if (saveBtn) {
            saveBtn.classList.remove('hidden');
        }
    }

    editAvatar() {
        document.getElementById('avatarInput').click();
    }

    editBanner() {
        document.getElementById('bannerInput').click();
    }

    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.uploadImage(file, 'avatar');
        }
    }

    handleBannerUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.uploadImage(file, 'banner');
        }
    }

    async uploadImage(file, type) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showToast('Image file size must be less than 5MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('action', 'uploadProfileImage');

        try {
            const response = await fetch('api/upload.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`, 'success');
                
                // Update preview
                const previewElement = type === 'avatar' 
                    ? document.getElementById('userAvatarPreview')
                    : document.getElementById('userBannerPreview');
                
                if (previewElement) {
                    previewElement.style.backgroundImage = `url(${data.url})`;
                }

                // Reload user data
                this.loadUserData();
            } else {
                this.showToast(data.error || `Failed to upload ${type}`, 'error');
            }
        } catch (error) {
            console.error(`Error uploading ${type}:`, error);
            this.showToast(`Failed to upload ${type}`, 'error');
        }
    }

    toggleEmailReveal() {
        const emailMasked = document.getElementById('emailMasked');
        const revealBtn = document.getElementById('revealEmailBtn');

        if (this.isEmailRevealed) {
            emailMasked.textContent = this.maskEmail(this.currentUser.Email);
            revealBtn.textContent = 'Reveal';
            this.isEmailRevealed = false;
        } else {
            emailMasked.textContent = this.currentUser.Email;
            revealBtn.textContent = 'Hide';
            this.isEmailRevealed = true;
        }
    }

    updateCharacterCount() {
        const aboutMeField = document.getElementById('aboutMeField');
        const countElement = document.getElementById('aboutMeCount');
        
        if (aboutMeField && countElement) {
            countElement.textContent = aboutMeField.value.length;
        }
    }

    initializeFormValidation() {
        const usernameField = document.getElementById('usernameField');
        const displayNameField = document.getElementById('displayNameField');

        if (usernameField) {
            usernameField.addEventListener('input', () => this.validateUsername());
        }

        if (displayNameField) {
            displayNameField.addEventListener('input', () => this.validateDisplayName());
        }
    }

    validateUsername() {
        const usernameField = document.getElementById('usernameField');
        const value = usernameField.value.trim();

        // Remove invalid characters
        const cleanValue = value.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanValue !== value) {
            usernameField.value = cleanValue;
        }

        // Show validation feedback
        this.showFieldValidation(usernameField, 
            cleanValue.length >= 2 && cleanValue.length <= 32,
            'Username must be 2-32 characters and contain only letters, numbers, and underscores'
        );
    }

    validateDisplayName() {
        const displayNameField = document.getElementById('displayNameField');
        const value = displayNameField.value.trim();

        this.showFieldValidation(displayNameField,
            value.length <= 32,
            'Display name must be 32 characters or less'
        );
    }

    showFieldValidation(field, isValid, message) {
        // Remove existing validation elements
        const existingValidation = field.parentNode.querySelector('.validation-message');
        if (existingValidation) {
            existingValidation.remove();
        }

        if (!isValid) {
            const validationMessage = document.createElement('div');
            validationMessage.className = 'validation-message error';
            validationMessage.textContent = message;
            field.parentNode.appendChild(validationMessage);
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    }

    async saveAccountChanges() {
        const formData = new FormData();
        formData.append('action', 'updateProfile');
        formData.append('username', document.getElementById('usernameField').value);
        formData.append('displayName', document.getElementById('displayNameField').value);
        formData.append('bio', document.getElementById('aboutMeField').value);

        try {
            const response = await fetch('api/user.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Profile updated successfully!', 'success');
                document.getElementById('saveAccountBtn').classList.add('hidden');
                this.loadUserData(); // Reload to get updated data
            } else {
                this.showToast(data.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Failed to update profile', 'error');
        }
    }

    resetAccountForm() {
        this.populateUserForm();
        document.getElementById('saveAccountBtn').classList.add('hidden');
        this.showToast('Form reset to original values', 'info');
    }

    // Audio/Video functionality
    async loadAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            const inputDevices = devices.filter(device => device.kind === 'audioinput');
            const outputDevices = devices.filter(device => device.kind === 'audiooutput');
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            this.populateDeviceSelect('inputDeviceSelect', inputDevices);
            this.populateDeviceSelect('outputDeviceSelect', outputDevices);
            this.populateDeviceSelect('cameraDeviceSelect', videoDevices);
        } catch (error) {
            console.error('Error loading audio devices:', error);
        }
    }

    populateDeviceSelect(selectId, devices) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '';
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Device ${device.deviceId.substring(0, 8)}`;
            select.appendChild(option);
        });
    }

    updateVolumeDisplay(slider) {
        const valueDisplay = slider.parentNode.querySelector('.volume-value');
        if (valueDisplay) {
            valueDisplay.textContent = `${slider.value}%`;
        }

        // Update volume indicator
        const indicator = document.getElementById(slider.id.replace('Slider', 'Indicator'));
        if (indicator) {
            const bar = indicator.querySelector('.volume-bar');
            if (bar) {
                bar.style.width = `${slider.value}%`;
            }
        }
    }

    async startMicTest() {
        const micTestBtn = document.getElementById('micTestBtn');
        const micTestIndicator = document.getElementById('micTestIndicator');

        try {
            micTestBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Test';
            micTestIndicator.classList.remove('hidden');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.deviceStreams.microphone = stream;

            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            
            microphone.connect(analyser);
            analyser.fftSize = 256;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const testBars = micTestIndicator.querySelectorAll('.test-bar');
            
            const updateBars = () => {
                if (!this.deviceStreams.microphone) return;

                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((sum, value) => sum + value) / bufferLength;
                const level = Math.floor((average / 255) * testBars.length);
                
                testBars.forEach((bar, index) => {
                    bar.classList.toggle('active', index < level);
                });
                
                requestAnimationFrame(updateBars);
            };
            
            updateBars();

            // Change button to stop
            micTestBtn.onclick = () => this.stopMicTest();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showToast('Failed to access microphone', 'error');
            this.stopMicTest();
        }
    }

    stopMicTest() {
        const micTestBtn = document.getElementById('micTestBtn');
        const micTestIndicator = document.getElementById('micTestIndicator');

        if (this.deviceStreams.microphone) {
            this.deviceStreams.microphone.getTracks().forEach(track => track.stop());
            this.deviceStreams.microphone = null;
        }

        micTestBtn.innerHTML = '<i class="fas fa-play"></i> Start Test';
        micTestIndicator.classList.add('hidden');
        micTestBtn.onclick = () => this.startMicTest();

        // Clear test bars
        const testBars = micTestIndicator.querySelectorAll('.test-bar');
        testBars.forEach(bar => bar.classList.remove('active'));
    }

    async testCamera() {
        const cameraVideo = document.getElementById('cameraVideo');
        const testCameraBtn = document.getElementById('testCameraBtn');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.deviceStreams.camera = stream;

            cameraVideo.srcObject = stream;
            cameraVideo.style.display = 'block';
            testCameraBtn.style.display = 'none';

        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showToast('Failed to access camera', 'error');
        }
    }

    stopCamera() {
        const cameraVideo = document.getElementById('cameraVideo');
        const testCameraBtn = document.getElementById('testCameraBtn');

        if (this.deviceStreams.camera) {
            this.deviceStreams.camera.getTracks().forEach(track => track.stop());
            this.deviceStreams.camera = null;
        }

        cameraVideo.style.display = 'none';
        testCameraBtn.style.display = 'inline-block';
        cameraVideo.srcObject = null;
    }

    // Password change functionality
    async loadSecurityQuestion() {
        try {
            const response = await fetch('api/user.php?action=getSecurityQuestion');
            const data = await response.json();
            
            if (data.success) {
                const questionLabel = document.getElementById('securityQuestionLabel');
                if (questionLabel) {
                    questionLabel.textContent = data.question;
                }
            }
        } catch (error) {
            console.error('Error loading security question:', error);
        }
    }

    async verifySecurityAnswer() {
        const answer = document.getElementById('securityAnswerInput').value;
        const formData = new FormData();
        formData.append('action', 'verifySecurityAnswer');
        formData.append('answer', answer);

        try {
            const response = await fetch('api/user.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Move to password step
                document.getElementById('securityStep').classList.remove('active');
                document.getElementById('passwordStep').classList.add('active');
            } else {
                this.showToast('Incorrect security answer', 'error');
            }
        } catch (error) {
            console.error('Error verifying security answer:', error);
            this.showToast('Failed to verify security answer', 'error');
        }
    }

    async changePassword() {
        const newPassword = document.getElementById('newPasswordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;

        if (newPassword !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('action', 'changePassword');
        formData.append('newPassword', newPassword);

        try {
            const response = await fetch('api/user.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Password changed successfully!', 'success');
                this.closePasswordChangeModal();
            } else {
                this.showToast(data.error || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showToast('Failed to change password', 'error');
        }
    }

    // Account deletion
    async checkServerOwnership() {
        try {
            const response = await fetch('api/user.php?action=checkOwnedServers');
            const data = await response.json();
            
            if (data.success && data.hasOwnedServers) {
                const warning = document.getElementById('serverOwnershipWarning');
                const serversList = document.getElementById('ownedServersList');
                const deleteBtn = document.getElementById('deleteAccountBtn');
                
                warning.classList.remove('hidden');
                deleteBtn.disabled = true;
                
                serversList.innerHTML = data.ownedServers.map(server => 
                    `<div class="owned-server">${server.Name}</div>`
                ).join('');
            }
        } catch (error) {
            console.error('Error checking server ownership:', error);
        }
    }

    async initiateAccountDeletion() {
        const confirmation = prompt('Type "DELETE" to confirm account deletion:');
        if (confirmation !== 'DELETE') {
            return;
        }

        const formData = new FormData();
        formData.append('action', 'deleteAccount');

        try {
            const response = await fetch('api/user.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Account deletion initiated. You will be logged out.', 'info');
                setTimeout(() => {
                    window.location.href = '/auth/logout.php';
                }, 2000);
            } else {
                this.showToast(data.error || 'Failed to delete account', 'error');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            this.showToast('Failed to delete account', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Global functions for the modal
function openUserSettingsModal() {
    document.getElementById('userSettingsModal').classList.remove('hidden');
}

function closeUserSettingsModal() {
    document.getElementById('userSettingsModal').classList.add('hidden');
    
    // Stop any active streams
    if (window.userSettingsManager) {
        window.userSettingsManager.stopMicTest();
        window.userSettingsManager.stopCamera();
    }
}

function openPasswordChangeModal() {
    document.getElementById('passwordChangeModal').classList.remove('hidden');
}

function closePasswordChangeModal() {
    document.getElementById('passwordChangeModal').classList.add('hidden');
    
    // Reset form
    document.getElementById('securityStep').classList.add('active');
    document.getElementById('passwordStep').classList.remove('active');
    document.getElementById('securityAnswerInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
}

function saveAccountChanges() {
    if (window.userSettingsManager) {
        window.userSettingsManager.saveAccountChanges();
    }
}

function resetAccountForm() {
    if (window.userSettingsManager) {
        window.userSettingsManager.resetAccountForm();
    }
}

function verifySecurityAnswer() {
    if (window.userSettingsManager) {
        window.userSettingsManager.verifySecurityAnswer();
    }
}

function changePassword() {
    if (window.userSettingsManager) {
        window.userSettingsManager.changePassword();
    }
}

function startMicTest() {
    if (window.userSettingsManager) {
        window.userSettingsManager.startMicTest();
    }
}

function testCamera() {
    if (window.userSettingsManager) {
        window.userSettingsManager.testCamera();
    }
}

function stopCamera() {
    if (window.userSettingsManager) {
        window.userSettingsManager.stopCamera();
    }
}

function initiateAccountDeletion() {
    if (window.userSettingsManager) {
        window.userSettingsManager.initiateAccountDeletion();
    }
}

function logout() {
    window.location.href = '/auth/logout.php';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userSettingsManager = new UserSettingsManager();
});
