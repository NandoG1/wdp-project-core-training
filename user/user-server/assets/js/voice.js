class VoiceManager {
    constructor() {
        this.localStream = null;
        this.peerConnections = new Map();
        this.currentChannelId = null;
        this.isInVoice = false;
        this.isMuted = false;
        this.isDeafened = false;
        this.isVideoEnabled = false;
        this.isScreenSharing = false;
        this.participants = new Set();
        
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.setupWebRTCConfig();
    }

    setupWebRTCConfig() {
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }

    bindEventListeners() {
        const leaveVoiceBtn = document.getElementById('leaveVoiceBtn');
        const toggleMicBtn = document.getElementById('toggleMicBtn');
        const toggleDeafenBtn = document.getElementById('toggleDeafenBtn');
        const toggleVideoBtn = document.getElementById('toggleVideoBtn');
        const toggleScreenShareBtn = document.getElementById('toggleScreenShareBtn');
        const activitiesBtn = document.getElementById('activitiesBtn');
        leaveVoiceBtn?.addEventListener('click', () => this.leaveVoiceChannel());
        toggleMicBtn?.addEventListener('click', () => this.toggleMute());
        toggleDeafenBtn?.addEventListener('click', () => this.toggleDeafen());
        toggleVideoBtn?.addEventListener('click', () => this.toggleVideo());
        toggleScreenShareBtn?.addEventListener('click', () => this.toggleScreenShare());
        activitiesBtn?.addEventListener('click', () => this.showActivities());
        if (window.socket) {
            window.socket.on('user_joined_voice', (data) => this.onUserJoinedVoice(data));
            window.socket.on('user_left_voice', (data) => this.onUserLeftVoice(data));
            window.socket.on('voice_channel_participants', (data) => this.onVoiceChannelParticipants(data));
            window.socket.on('webrtc_offer', (data) => this.onWebRTCOffer(data));
            window.socket.on('webrtc_answer', (data) => this.onWebRTCAnswer(data));
            window.socket.on('webrtc_ice_candidate', (data) => this.onWebRTCIceCandidate(data));
        }
        document.addEventListener('dblclick', (e) => {
            if (e.target.matches('.participant-video, .screen-share-video')) {
                this.toggleFullscreen(e.target);
            }
        });
    }

    async joinVoiceChannel(channelId = null) {
        if (this.isInVoice) return;
        const targetChannelId = channelId || (window.serverApp?.currentChannel?.ID);
        if (!targetChannelId) {
            console.error('No channel ID provided for voice join');
            return;
        }

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });

            this.currentChannelId = targetChannelId;
            this.isInVoice = true;
            if (window.socket) {
                window.socket.emit('join_voice', { channelId: targetChannelId });
            }
            this.updateVoiceUI();
            this.showVoiceControls();
            this.addLocalParticipant();

            if (window.serverApp) {
                window.serverApp.showToast('Joined voice channel', 'success');
            }
        } catch (error) {
            console.error('Error joining voice channel:', error);
            if (window.serverApp) {
                window.serverApp.showToast('Failed to access microphone', 'error');
            }
        }
    }

    async leaveVoiceChannel() {
        if (!this.isInVoice) return;

        try {
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
            this.peerConnections.forEach((pc, userId) => {
                pc.close();
            });
            this.peerConnections.clear();
            if (window.socket) {
                window.socket.emit('leave_voice', { channelId: this.currentChannelId });
            }

            this.currentChannelId = null;
            this.isInVoice = false;
            this.isVideoEnabled = false;
            this.isScreenSharing = false;
            this.participants.clear();
            this.updateVoiceUI();
            this.hideVoiceControls();
            this.clearParticipants();

            if (window.serverApp) {
                window.serverApp.showToast('Left voice channel', 'info');
            }
        } catch (error) {
            console.error('Error leaving voice channel:', error);
        }
    }

    async onVoiceChannelParticipants(data) {
        const { channelId, participants } = data;
        
        if (channelId !== this.currentChannelId) return;
        for (const userId of participants) {
            if (userId !== window.currentUser?.id) {
                this.participants.add(userId);
                this.addParticipant(userId);
                await this.createPeerConnection(userId);
                const offer = await this.peerConnections.get(userId).createOffer();
                await this.peerConnections.get(userId).setLocalDescription(offer);
                
                window.socket.emit('webrtc_offer', {
                    channelId: channelId,
                    to: userId,
                    offer: offer
                });
            }
        }
    }

    async onUserJoinedVoice(data) {
        const { userId, channelId } = data;
        
        if (channelId !== this.currentChannelId || userId === window.currentUser?.id) return;

        this.participants.add(userId);
        this.addParticipant(userId);
        await this.createPeerConnection(userId);
        const offer = await this.peerConnections.get(userId).createOffer();
        await this.peerConnections.get(userId).setLocalDescription(offer);
        
        window.socket.emit('webrtc_offer', {
            channelId: channelId,
            to: userId,
            offer: offer
        });
    }

    async onUserLeftVoice(data) {
        const { userId, channelId } = data;
        
        if (channelId !== this.currentChannelId) return;

        this.participants.delete(userId);
        this.removeParticipant(userId);
        const pc = this.peerConnections.get(userId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(userId);
        }
    }

    async onWebRTCOffer(data) {
        const { from, offer } = data;
        
        if (!this.isInVoice) return;
        if (!this.peerConnections.has(from)) {
            await this.createPeerConnection(from);
        }

        const pc = this.peerConnections.get(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        window.socket.emit('webrtc_answer', {
            channelId: this.currentChannelId,
            to: from,
            answer: answer
        });
    }

    async onWebRTCAnswer(data) {
        const { from, answer } = data;
        
        const pc = this.peerConnections.get(from);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    async onWebRTCIceCandidate(data) {
        const { from, candidate } = data;
        
        const pc = this.peerConnections.get(from);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    async createPeerConnection(userId) {
        const pc = new RTCPeerConnection(this.rtcConfig);
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            this.handleRemoteStream(userId, remoteStream);
        };
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                window.socket.emit('webrtc_ice_candidate', {
                    channelId: this.currentChannelId,
                    to: userId,
                    candidate: event.candidate
                });
            }
        };
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${userId}:`, pc.connectionState);
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                this.handleConnectionFailure(userId);
            }
        };

        this.peerConnections.set(userId, pc);
        return pc;
    }

    handleRemoteStream(userId, stream) {
        const participantElement = document.querySelector(`[data-user-id="${userId}"]`);
        if (participantElement) {
            const audioElement = participantElement.querySelector('.participant-audio');
            const videoElement = participantElement.querySelector('.participant-video');
            
            if (audioElement) {
                audioElement.srcObject = stream;
                audioElement.play();
            }
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0 && videoElement) {
                videoElement.srcObject = stream;
                videoElement.style.display = 'block';
            }
        }
    }

    handleConnectionFailure(userId) {
        console.warn(`Connection failed with user ${userId}, attempting to reconnect...`);
        setTimeout(async () => {
            if (this.isInVoice && this.participants.has(userId)) {
                const pc = this.peerConnections.get(userId);
                if (pc) {
                    pc.close();
                    this.peerConnections.delete(userId);
                }
                await this.createPeerConnection(userId);
            }
        }, 2000);
    }

    toggleMute() {
        if (!this.localStream) return;

        this.isMuted = !this.isMuted;
        
        const audioTracks = this.localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !this.isMuted;
        });

        this.updateMuteButton();
        
        const status = this.isMuted ? 'Muted' : 'Unmuted';
        if (window.serverApp) {
            window.serverApp.showToast(status, 'info');
        }
    }

    toggleDeafen() {
        this.isDeafened = !this.isDeafened;
        if (this.isDeafened && !this.isMuted) {
            this.toggleMute();
        }
        document.querySelectorAll('.participant-audio').forEach(audio => {
            audio.muted = this.isDeafened;
        });

        this.updateDeafenButton();
        
        const status = this.isDeafened ? 'Deafened' : 'Undeafened';
        if (window.serverApp) {
            window.serverApp.showToast(status, 'info');
        }
    }

    async toggleVideo() {
        if (!this.isInVoice) return;

        try {
            if (!this.isVideoEnabled) {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = videoStream.getVideoTracks()[0];
                this.peerConnections.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    } else {
                        pc.addTrack(videoTrack, this.localStream);
                    }
                });
                this.localStream.addTrack(videoTrack);
                this.isVideoEnabled = true;
                this.showLocalVideo();
                
            } else {
                const videoTracks = this.localStream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.stop();
                    this.localStream.removeTrack(track);
                });
                
                this.isVideoEnabled = false;
                this.hideLocalVideo();
            }

            this.updateVideoButton();
            
        } catch (error) {
            console.error('Error toggling video:', error);
            if (window.serverApp) {
                window.serverApp.showToast('Failed to access camera', 'error');
            }
        }
    }

    async toggleScreenShare() {
        if (!this.isInVoice) return;

        try {
            if (!this.isScreenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true, 
                    audio: true 
                });
                
                const videoTrack = screenStream.getVideoTracks()[0];
                this.peerConnections.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    } else {
                        pc.addTrack(videoTrack, screenStream);
                    }
                });
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };

                this.isScreenSharing = true;
                this.showScreenShare();
                
            } else {
                this.stopScreenShare();
            }

            this.updateScreenShareButton();
            
        } catch (error) {
            console.error('Error toggling screen share:', error);
            if (window.serverApp) {
                window.serverApp.showToast('Failed to start screen sharing', 'error');
            }
        }
    }

    stopScreenShare() {
        if (!this.isScreenSharing) return;
        this.localStream.getVideoTracks().forEach(track => {
            if (track.label.includes('screen')) {
                track.stop();
                this.localStream.removeTrack(track);
            }
        });

        this.isScreenSharing = false;
        this.hideScreenShare();
        this.updateScreenShareButton();
    }

    showActivities() {
        const activitiesModal = document.getElementById('activitiesModal');
        if (activitiesModal) {
            modalManager.openModal('activitiesModal');
        }
    }
    updateVoiceUI() {
        const voiceInterface = document.getElementById('voiceInterface');
        const chatInterface = document.querySelector('.chat-interface');
        
        if (this.isInVoice) {
            voiceInterface?.classList.remove('hidden');
            chatInterface?.classList.add('hidden');
        } else {
            voiceInterface?.classList.add('hidden');
            chatInterface?.classList.remove('hidden');
        }
    }

    showVoiceControls() {
        const voiceControls = document.querySelector('.voice-controls');
        if (voiceControls) {
            voiceControls.style.display = 'flex';
        }
    }

    hideVoiceControls() {
        const voiceControls = document.querySelector('.voice-controls');
        if (voiceControls) {
            voiceControls.style.display = 'none';
        }
    }

    updateMuteButton() {
        const muteBtn = document.getElementById('toggleMicBtn');
        if (muteBtn) {
            muteBtn.classList.toggle('active', this.isMuted);
            const icon = muteBtn.querySelector('i');
            if (icon) {
                icon.className = this.isMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
            }
            muteBtn.title = this.isMuted ? 'Unmute' : 'Mute';
        }
    }

    updateDeafenButton() {
        const deafenBtn = document.getElementById('toggleDeafenBtn');
        if (deafenBtn) {
            deafenBtn.classList.toggle('active', this.isDeafened);
            const icon = deafenBtn.querySelector('i');
            if (icon) {
                icon.className = this.isDeafened ? 'fas fa-headphones-slash' : 'fas fa-headphones';
            }
            deafenBtn.title = this.isDeafened ? 'Undeafen' : 'Deafen';
        }
    }

    updateVideoButton() {
        const videoBtn = document.getElementById('toggleVideoBtn');
        if (videoBtn) {
            videoBtn.classList.toggle('active', this.isVideoEnabled);
            const icon = videoBtn.querySelector('i');
            if (icon) {
                icon.className = this.isVideoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
            }
            videoBtn.title = this.isVideoEnabled ? 'Turn off camera' : 'Turn on camera';
        }
    }

    updateScreenShareButton() {
        const screenShareBtn = document.getElementById('toggleScreenShareBtn');
        if (screenShareBtn) {
            screenShareBtn.classList.toggle('active', this.isScreenSharing);
            screenShareBtn.title = this.isScreenSharing ? 'Stop sharing' : 'Share screen';
        }
    }

    addLocalParticipant() {
        const participantsContainer = document.getElementById('voiceParticipants');
        if (!participantsContainer) return;

        const localParticipant = document.createElement('div');
        localParticipant.className = 'participant local-participant';
        localParticipant.dataset.userId = window.currentUser?.id;
        
        localParticipant.innerHTML = `
            <div class="participant-avatar">
                <img src="${window.currentUser?.avatar || '/assets/images/default-avatar.png'}" alt="You">
                <div class="speaking-indicator"></div>
            </div>
            <div class="participant-name">${window.currentUser?.username || 'You'}</div>
            <div class="participant-controls">
                <button class="participant-mute" title="Mute">
                    <i class="fas fa-microphone"></i>
                </button>
            </div>
            <video class="participant-video local-video" autoplay muted style="display: none;"></video>
        `;

        participantsContainer.appendChild(localParticipant);
    }

    addParticipant(userId) {
        const participantsContainer = document.getElementById('voiceParticipants');
        if (!participantsContainer) return;
        const participant = document.createElement('div');
        participant.className = 'participant';
        participant.dataset.userId = userId;
        
        participant.innerHTML = `
            <div class="participant-avatar">
                <img src="/assets/images/default-avatar.png" alt="User ${userId}">
                <div class="speaking-indicator"></div>
            </div>
            <div class="participant-name">User ${userId}</div>
            <div class="participant-controls">
                <button class="participant-mute" title="Mute">
                    <i class="fas fa-microphone"></i>
                </button>
            </div>
            <audio class="participant-audio" autoplay></audio>
            <video class="participant-video" autoplay style="display: none;"></video>
        `;

        participantsContainer.appendChild(participant);
    }

    removeParticipant(userId) {
        const participant = document.querySelector(`[data-user-id="${userId}"]`);
        if (participant) {
            participant.remove();
        }
    }

    clearParticipants() {
        const participantsContainer = document.getElementById('voiceParticipants');
        if (participantsContainer) {
            participantsContainer.innerHTML = '';
        }
    }

    showLocalVideo() {
        const localVideo = document.querySelector('.local-video');
        if (localVideo && this.localStream) {
            localVideo.srcObject = this.localStream;
            localVideo.style.display = 'block';
        }
    }

    hideLocalVideo() {
        const localVideo = document.querySelector('.local-video');
        if (localVideo) {
            localVideo.style.display = 'none';
        }
    }

    showScreenShare() {
        const screenShareContainer = document.querySelector('.screen-share-container');
        if (screenShareContainer) {
            screenShareContainer.style.display = 'block';
        }
    }

    hideScreenShare() {
        const screenShareContainer = document.querySelector('.screen-share-container');
        if (screenShareContainer) {
            screenShareContainer.style.display = 'none';
        }
    }

    toggleFullscreen(element) {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            element.requestFullscreen();
        }
    }
    async getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return {
                audioInputs: devices.filter(device => device.kind === 'audioinput'),
                audioOutputs: devices.filter(device => device.kind === 'audiooutput'),
                videoInputs: devices.filter(device => device.kind === 'videoinput')
            };
        } catch (error) {
            console.error('Error getting devices:', error);
            return { audioInputs: [], audioOutputs: [], videoInputs: [] };
        }
    }

    async switchAudioInput(deviceId) {
        if (!this.localStream) return;

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } },
                video: this.isVideoEnabled
            });

            const audioTrack = newStream.getAudioTracks()[0];
            this.peerConnections.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
                if (sender) {
                    sender.replaceTrack(audioTrack);
                }
            });
            const oldAudioTrack = this.localStream.getAudioTracks()[0];
            if (oldAudioTrack) {
                this.localStream.removeTrack(oldAudioTrack);
                oldAudioTrack.stop();
            }
            this.localStream.addTrack(audioTrack);

        } catch (error) {
            console.error('Error switching audio input:', error);
            if (window.serverApp) {
                window.serverApp.showToast('Failed to switch microphone', 'error');
            }
        }
    }

    async switchVideoInput(deviceId) {
        if (!this.isVideoEnabled) return;

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { deviceId: { exact: deviceId } }
            });

            const videoTrack = newStream.getVideoTracks()[0];
            this.peerConnections.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });
            const oldVideoTrack = this.localStream.getVideoTracks()[0];
            if (oldVideoTrack) {
                this.localStream.removeTrack(oldVideoTrack);
                oldVideoTrack.stop();
            }
            this.localStream.addTrack(videoTrack);
            this.showLocalVideo();

        } catch (error) {
            console.error('Error switching video input:', error);
            if (window.serverApp) {
                window.serverApp.showToast('Failed to switch camera', 'error');
            }
        }
    }
}
const voiceManager = new VoiceManager();
window.voiceManager = voiceManager;