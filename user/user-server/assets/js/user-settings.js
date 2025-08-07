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
        this.initializeVoiceVideo();
    }

    async initializeVoiceVideo() {
        try {
            // Request microphone and camera permissions
            await this.requestMediaPermissions();
            // Load available devices
            await this.loadMediaDevices();
            // Initialize volume controls
            this.initializeVolumeControls();
        } catch (error) {
            console.error('Error initializing voice/video:', error);
        }
    }

    async requestMediaPermissions() {
        try {
            // Request both audio and video permissions
            this.mediaPermissions = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            });
            
            // Stop the streams immediately - we just needed permissions
            this.mediaPermissions.getTracks().forEach(track => track.stop());
            this.mediaPermissions = null;
        } catch (error) {
            console.warn('Media permissions not granted:', error);
            // Try audio only
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioStream.getTracks().forEach(track => track.stop());
            } catch (audioError) {
                console.warn('Audio permission not granted:', audioError);
            }
        }
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

        // Volume slider controls
        document.addEventListener('input', (e) => {
            if (e.target.id === 'inputVolumeSlider') {
                this.updateInputVolume(e.target.value);
            }
            if (e.target.id === 'outputVolumeSlider') {
                this.updateOutputVolume(e.target.value);
            }
        });

        // Device selection changes
        document.addEventListener('change', (e) => {
            if (e.target.id === 'inputDeviceSelect') {
                this.changeInputDevice(e.target.value);
            }
            if (e.target.id === 'outputDeviceSelect') {
                this.changeOutputDevice(e.target.value);
            }
            if (e.target.id === 'cameraDeviceSelect') {
                this.changeCameraDevice(e.target.value);
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
                this.loadMediaDevices();
                this.initializeVolumeControls();
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

    // Media Device Management
    async loadMediaDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
            const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            this.populateDeviceSelects(audioInputDevices, audioOutputDevices, videoDevices);
            
            // Listen for device changes
            navigator.mediaDevices.addEventListener('devicechange', () => {
                this.loadMediaDevices();
            });
        } catch (error) {
            console.error('Error enumerating devices:', error);
            this.showToast('Could not load media devices', 'error');
        }
    }

    populateDeviceSelects(audioInputs, audioOutputs, videoInputs) {
        // Populate input devices
        const inputSelect = document.getElementById('inputDeviceSelect');
        if (inputSelect) {
            const currentValue = inputSelect.value;
            inputSelect.innerHTML = '';
            
            audioInputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Microphone ${inputSelect.options.length + 1}`;
                inputSelect.appendChild(option);
            });
            
            // Restore selection if device still exists
            if (currentValue && audioInputs.find(d => d.deviceId === currentValue)) {
                inputSelect.value = currentValue;
            }
        }

        // Populate output devices
        const outputSelect = document.getElementById('outputDeviceSelect');
        if (outputSelect) {
            const currentValue = outputSelect.value;
            outputSelect.innerHTML = '';
            
            audioOutputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Speaker ${outputSelect.options.length + 1}`;
                outputSelect.appendChild(option);
            });
            
            if (currentValue && audioOutputs.find(d => d.deviceId === currentValue)) {
                outputSelect.value = currentValue;
            }
        }

        // Populate camera devices
        const cameraSelect = document.getElementById('cameraDeviceSelect');
        if (cameraSelect) {
            const currentValue = cameraSelect.value;
            cameraSelect.innerHTML = '';
            
            if (videoInputs.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No camera detected';
                cameraSelect.appendChild(option);
                cameraSelect.disabled = true;
            } else {
                cameraSelect.disabled = false;
                videoInputs.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `Camera ${cameraSelect.options.length + 1}`;
                    cameraSelect.appendChild(option);
                });
                
                if (currentValue && videoInputs.find(d => d.deviceId === currentValue)) {
                    cameraSelect.value = currentValue;
                }
            }
        }
    }

    initializeVolumeControls() {
        // Set initial volume values and indicators
        const inputSlider = document.getElementById('inputVolumeSlider');
        const outputSlider = document.getElementById('outputVolumeSlider');
        
        if (inputSlider) {
            this.updateInputVolume(inputSlider.value);
        }
        if (outputSlider) {
            this.updateOutputVolume(outputSlider.value);
        }
    }

    updateInputVolume(value) {
        const volumeValue = document.querySelector('#inputVolumeSlider').parentNode.querySelector('.volume-value');
        const volumeBar = document.querySelector('#inputVolumeIndicator .volume-bar');
        
        if (volumeValue) volumeValue.textContent = `${value}%`;
        if (volumeBar) volumeBar.style.width = `${value}%`;
        
        // Store the volume setting
        this.inputVolume = value / 100;
    }

    updateOutputVolume(value) {
        const volumeValue = document.querySelector('#outputVolumeSlider').parentNode.querySelector('.volume-value');
        const volumeBar = document.querySelector('#outputVolumeIndicator .volume-bar');
        
        if (volumeValue) volumeValue.textContent = `${value}%`;
        if (volumeBar) volumeBar.style.width = `${value}%`;
        
        // Apply volume to audio elements
        document.querySelectorAll('audio, video').forEach(media => {
            media.volume = value / 100;
        });
        
        this.outputVolume = value / 100;
    }

    async changeInputDevice(deviceId) {
        try {
            // Stop current microphone stream
            if (this.deviceStreams.microphone) {
                this.deviceStreams.microphone.getTracks().forEach(track => track.stop());
                this.deviceStreams.microphone = null;
            }

            // Store the selected device
            this.selectedInputDevice = deviceId;
            this.showToast('Input device selected', 'success');
        } catch (error) {
            console.error('Error changing input device:', error);
            this.showToast('Could not change input device', 'error');
        }
    }

    async changeOutputDevice(deviceId) {
        try {
            // Store the selected device
            this.selectedOutputDevice = deviceId;
            
            // Apply to existing audio/video elements if browser supports setSinkId
            const audioElements = document.querySelectorAll('audio, video');
            
            for (const element of audioElements) {
                if (element.setSinkId && typeof element.setSinkId === 'function') {
                    try {
                        await element.setSinkId(deviceId);
                    } catch (e) {
                        console.warn('Could not set sink ID:', e);
                    }
                }
            }
            
            this.showToast('Output device selected', 'success');
        } catch (error) {
            console.error('Error changing output device:', error);
            this.showToast('Could not change output device', 'error');
        }
    }

    async changeCameraDevice(deviceId) {
        try {
            // Stop current camera stream
            if (this.deviceStreams.camera) {
                this.deviceStreams.camera.getTracks().forEach(track => track.stop());
                this.deviceStreams.camera = null;
            }

            // Store the selected device
            this.selectedCameraDevice = deviceId;
            
            // If camera preview is active, restart with new device
            const cameraVideo = document.getElementById('cameraVideo');
            if (cameraVideo && cameraVideo.style.display !== 'none' && !cameraVideo.srcObject) {
                await this.testCamera();
            }
            
            this.showToast('Camera device selected', 'success');
        } catch (error) {
            console.error('Error changing camera device:', error);
            this.showToast('Could not change camera device', 'error');
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
        const stopCameraBtn = document.getElementById('stopCameraBtn');
        const cameraPreview = document.getElementById('cameraPreview');
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');

        try {
            // Use selected camera device or default
            const constraints = {
                video: this.selectedCameraDevice 
                    ? { deviceId: { exact: this.selectedCameraDevice } }
                    : true
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.deviceStreams.camera = stream;

            cameraVideo.srcObject = stream;
            cameraVideo.style.display = 'block';
            testCameraBtn.style.display = 'none';
            
            if (cameraPlaceholder) {
                cameraPlaceholder.style.display = 'none';
            }
            
            if (cameraPreview) {
                cameraPreview.classList.add('active');
            }
            
            if (stopCameraBtn) {
                stopCameraBtn.style.display = 'inline-flex';
            }

            this.showToast('Camera test started', 'success');
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showToast('Failed to access camera. Please check camera permissions.', 'error');
        }
    }

    stopCamera() {
        const cameraVideo = document.getElementById('cameraVideo');
        const testCameraBtn = document.getElementById('testCameraBtn');
        const stopCameraBtn = document.getElementById('stopCameraBtn');
        const cameraPreview = document.getElementById('cameraPreview');
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');

        if (this.deviceStreams.camera) {
            this.deviceStreams.camera.getTracks().forEach(track => track.stop());
            this.deviceStreams.camera = null;
        }

        cameraVideo.style.display = 'none';
        cameraVideo.srcObject = null;
        testCameraBtn.style.display = 'inline-flex';
        
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'flex';
        }
        
        if (cameraPreview) {
            cameraPreview.classList.remove('active');
        }
        
        if (stopCameraBtn) {
            stopCameraBtn.style.display = 'none';
        }

        this.showToast('Camera test stopped', 'info');
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
    // Switch to default tab (My Account)
    if (window.userSettingsManager) {
        window.userSettingsManager.switchTab('my-account');
    }
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

function stopCamera() {
    if (window.userSettingsManager) {
        window.userSettingsManager.stopCamera();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userSettingsManager = new UserSettingsManager();
});
