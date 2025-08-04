# MisVord Home Page

A comprehensive Discord-like home page implementation with real-time messaging, friend management, and file sharing capabilities.

## Features

### 🏠 Home Page Layout
- **Sidebar Navigation**: Friends tab, Nitro tab, and direct message list
- **Main Content Area**: Friend management tabs (Online, All, Pending, Add Friend)
- **Active Now Section**: Shows currently online friends
- **Real-time Updates**: Socket.IO integration for live updates

### 👥 Friend Management
- **Online Tab**: View friends who are currently online with search functionality
- **All Tab**: View all friends with their status and search capability
- **Add Friend Tab**: Send friend requests using username#discriminator format
- **Pending Tab**: Manage incoming and outgoing friend requests
  - Accept/decline incoming requests
  - Cancel outgoing requests
  - Search through pending requests

### 💬 Direct Messaging
- **Private Conversations**: One-on-one messaging with friends
- **Group Chats**: Create group conversations with multiple friends
- **Message Features**:
  - Reply to messages with threading
  - Edit your own messages
  - Delete messages with confirmation
  - Emoji reactions with picker
  - File attachments with preview
  - Message mentions (@username)
  - Typing indicators
  - Real-time message delivery

### 📎 File Upload System
- **Multi-file Support**: Upload multiple files simultaneously
- **File Types**: Images, videos, audio, documents (PDF, DOC, DOCX, TXT)
- **Security**: File type validation and size limits (50MB max)
- **Thumbnails**: Automatic thumbnail generation for images
- **Preview**: File preview before sending
- **Storage**: User-specific directories with unique filename generation

### 🎭 Emoji System
- **Emoji Picker**: Categorized emoji selection (smileys, people, nature, etc.)
- **Reactions**: Add/remove emoji reactions to messages
- **Shortcodes**: Support for :emoji: shortcode conversion
- **Frequently Used**: Track and display frequently used emojis

### ⚡ Real-time Features
- **Socket.IO Integration**: WebSocket connections for real-time updates
- **Typing Indicators**: See when users are typing
- **Live Status**: Real-time friend status updates
- **Message Delivery**: Instant message delivery and receipt
- **Notifications**: Browser and in-app notifications

## File Structure

```
user/home/
├── index.php                 # Main home page
├── assets/
│   ├── css/
│   │   └── styles.css        # Comprehensive Discord-like styling
│   └── js/
│       ├── socket-client.js  # Socket.IO client for real-time features
│       ├── home.js          # Home page management
│       ├── friends.js       # Friend management functionality
│       ├── chat.js          # Chat and messaging features
│       └── emoji.js         # Emoji picker and reactions
├── api/
│   ├── config.php           # Database configuration
│   ├── friends.php          # Friend management API
│   ├── chat.php            # Chat and messaging API
│   ├── upload.php          # File upload API
│   └── user.php            # User information API
└── README.md               # This documentation
```

## Database Schema

The application uses the provided ERD schema with these key tables:

- **Users**: User accounts and profiles
- **FriendsList**: Friend relationships and requests
- **ChatRoom**: Direct messages and group chats
- **ChatParticipants**: Chat room membership
- **Message**: Chat messages with replies
- **MessageReaction**: Emoji reactions
- **Uploads**: File upload metadata

## API Endpoints

### Friends API (`/api/friends.php`)
- `GET ?action=online` - Get online friends
- `GET ?action=all` - Get all friends
- `GET ?action=pending` - Get pending requests
- `GET ?action=search&query=...` - Search friends
- `POST action=send_request` - Send friend request
- `POST action=accept_request` - Accept friend request
- `POST action=decline_request` - Decline friend request
- `POST action=cancel_request` - Cancel friend request

### Chat API (`/api/chat.php`)
- `GET ?action=conversations` - Get user conversations
- `GET ?action=messages&room_id=...` - Get messages for room
- `GET ?action=active_users` - Get active users
- `POST action=create_dm` - Create direct message/group
- `POST action=send_message` - Send message
- `POST action=edit_message` - Edit message
- `POST action=delete_message` - Delete message
- `POST action=react_message` - Add/remove reaction

### Upload API (`/api/upload.php`)
- `POST` with `files[]` - Upload multiple files
- Returns file URLs and metadata
- Automatic thumbnail generation for images

### User API (`/api/user.php`)
- `GET ?action=current` - Get current user info

## Security Features

- **Session Validation**: All API endpoints validate user sessions
- **File Type Validation**: MIME type checking for uploads
- **SQL Injection Protection**: Prepared statements throughout
- **XSS Prevention**: Content sanitization and escaping
- **File Size Limits**: 50MB maximum file size
- **User Isolation**: User-specific upload directories

## Browser Support

- Modern browsers with WebSocket support
- Chrome 16+, Firefox 11+, Safari 7+, Edge 12+
- Mobile browsers on iOS 6+ and Android 4.4+

## Installation Requirements

- PHP 7.4+ with mysqli extension
- MySQL 5.7+ or MariaDB 10.2+
- GD extension for image thumbnail generation
- Socket.IO server for real-time features
- Web server (Apache/Nginx)

## Usage

1. **Setup Database**: Import the provided `db.sql` schema
2. **Configure Database**: Update `api/config.php` with your database credentials
3. **Upload Directory**: Ensure `uploads/` directory is writable
4. **Socket.IO Server**: Set up Socket.IO server for real-time features
5. **Session Management**: Implement proper user authentication

## Real-time Features Setup

The application requires a Socket.IO server for real-time functionality. Example Node.js server:

```javascript
const io = require('socket.io')(3000);

io.on('connection', (socket) => {
    // Handle user authentication
    socket.on('authenticate', (data) => {
        // Authenticate user and join appropriate rooms
    });
    
    // Handle room joining
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
    });
    
    // Handle messaging
    socket.on('send_message', (data) => {
        socket.to(data.room_id).emit('new_message', data);
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
        socket.to(data.room_id).emit('user_typing', data);
    });
});
```

## Customization

### Themes
The CSS uses CSS custom properties for easy theming. Modify the `:root` variables in `styles.css` to change colors and appearance.

### Emoji Categories
Add new emoji categories in `emoji.js` by extending the `emojiData` object.

### File Types
Modify `upload.php` to support additional file types by updating the `$allowed_types` array.

### UI Components
All UI components are modular and can be easily customized or replaced.

## Performance Optimizations

- **Lazy Loading**: Messages load in batches
- **Image Thumbnails**: Automatic thumbnail generation reduces bandwidth
- **WebSocket Efficiency**: Only essential real-time updates
- **Database Indexing**: Optimized queries with proper indexing
- **File Caching**: Static file caching for better performance

## License

This implementation follows the project requirements and uses standard web technologies. No external licenses required for the core functionality.

## Support

For issues or questions about this implementation, refer to the codebase documentation and comments within the individual files.