const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
const io = new Server(8010, {
    cors: {
        origin: ["http://localhost", "http://localhost:80", "http://localhost:8080", "http://127.0.0.1"],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Add your MySQL password here
    database: 'wdp_discord' // Add your database name here
};

let db = null;
async function initDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}
initDB();
const activeUsers = new Map();
const channelUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('authenticate', (data) => {
        const { userId, username } = data;
        socket.userId = userId;
        socket.username = username;
        
        activeUsers.set(userId, {
            socketId: socket.id,
            username: username,
            status: 'online'
        });
        
        console.log(`User ${username} (${userId}) authenticated`);
        socket.broadcast.emit('user_status_update', {
            userId: userId,
            username: username,
            status: 'online'
        });
    });
    socket.on('join_server', (data) => {
        const { serverId } = data;
        socket.join(`server_${serverId}`);
        console.log(`User ${socket.username} joined server ${serverId}`);
    });
    socket.on('join_channel', (data) => {
        const { channelId, serverId } = data;
        if (socket.currentChannelId) {
            socket.leave(`channel_${socket.currentChannelId}`);
            removeUserFromChannel(socket.currentChannelId, socket.userId);
        }
        socket.join(`channel_${channelId}`);
        socket.currentChannelId = channelId;
        socket.currentServerId = serverId;
        
        addUserToChannel(channelId, socket.userId, socket.username);
        
        console.log(`User ${socket.username} joined channel ${channelId}`);
        socket.to(`channel_${channelId}`).emit('user_joined_channel', {
            userId: socket.userId,
            username: socket.username,
            channelId: channelId
        });
        const channelMembers = getChannelMembers(channelId);
        socket.emit('channel_members', {
            channelId: channelId,
            members: channelMembers
        });
    });
    socket.on('new_message', (data) => {
        const { channelId, messageData } = data;
        
        console.log(`New message in channel ${channelId}:`, messageData);
        socket.to(`channel_${channelId}`).emit('message_received', {
            channelId: channelId,
            message: messageData
        });
    });
    socket.on('edit_message', (data) => {
        const { channelId, messageId, newContent } = data;
        socket.to(`channel_${channelId}`).emit('message_edited', {
            channelId: channelId,
            messageId: messageId,
            newContent: newContent,
            editedAt: new Date().toISOString()
        });
    });
    socket.on('delete_message', (data) => {
        const { channelId, messageId } = data;
        socket.to(`channel_${channelId}`).emit('message_deleted', {
            channelId: channelId,
            messageId: messageId
        });
    });
    socket.on('add_reaction', (data) => {
        const { channelId, messageId, emoji, userId } = data;
        socket.to(`channel_${channelId}`).emit('reaction_added', {
            channelId: channelId,
            messageId: messageId,
            emoji: emoji,
            userId: userId
        });
    });

    socket.on('remove_reaction', (data) => {
        const { channelId, messageId, emoji, userId } = data;
        socket.to(`channel_${channelId}`).emit('reaction_removed', {
            channelId: channelId,
            messageId: messageId,
            emoji: emoji,
            userId: userId
        });
    });
    socket.on('typing_start', (data) => {
        const { channelId, username } = data;
        socket.to(`channel_${channelId}`).emit('user_typing', {
            channelId: channelId,
            username: username,
            isTyping: true
        });
    });

    socket.on('typing_stop', (data) => {
        const { channelId, username } = data;
        socket.to(`channel_${channelId}`).emit('user_typing', {
            channelId: channelId,
            username: username,
            isTyping: false
        });
    });
    socket.on('join_voice', (data) => {
        const { channelId, userId, username } = data;
        socket.join(`voice_${channelId}`);
        
        socket.to(`voice_${channelId}`).emit('user_joined_voice', {
            channelId: channelId,
            userId: userId,
            username: username
        });
    });

    socket.on('leave_voice', (data) => {
        const { channelId, userId, username } = data;
        socket.leave(`voice_${channelId}`);
        
        socket.to(`voice_${channelId}`).emit('user_left_voice', {
            channelId: channelId,
            userId: userId,
            username: username
        });
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        if (socket.userId) {
            activeUsers.delete(socket.userId);
            if (socket.currentChannelId) {
                removeUserFromChannel(socket.currentChannelId, socket.userId);
                socket.to(`channel_${socket.currentChannelId}`).emit('user_left_channel', {
                    userId: socket.userId,
                    username: socket.username,
                    channelId: socket.currentChannelId
                });
            }
            socket.broadcast.emit('user_status_update', {
                userId: socket.userId,
                username: socket.username,
                status: 'offline'
            });
        }
    });
});
function addUserToChannel(channelId, userId, username) {
    if (!channelUsers.has(channelId)) {
        channelUsers.set(channelId, new Map());
    }
    
    channelUsers.get(channelId).set(userId, {
        username: username,
        joinedAt: new Date().toISOString()
    });
}

function removeUserFromChannel(channelId, userId) {
    if (channelUsers.has(channelId)) {
        channelUsers.get(channelId).delete(userId);
        if (channelUsers.get(channelId).size === 0) {
            channelUsers.delete(channelId);
        }
    }
}

function getChannelMembers(channelId) {
    if (!channelUsers.has(channelId)) {
        return [];
    }
    
    const members = [];
    channelUsers.get(channelId).forEach((userData, userId) => {
        members.push({
            userId: userId,
            username: userData.username,
            joinedAt: userData.joinedAt
        });
    });
    
    return members;
}

console.log('Socket.IO server running on port 8010');
console.log('CORS enabled for localhost origins');
