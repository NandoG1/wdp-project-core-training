# Discord Clone - Server Explorer

A fully functional Discord-like server exploration page with real database integration, beautiful UI, and comprehensive features.

## 🚀 Features

### Core Functionality
- **Server Discovery**: Browse all publicly available servers
- **Category-based Browsing**: Organized by Gaming, Music, Technology, Education, Art, Entertainment, Community, and Sports
- **Advanced Search**: Real-time search across server names and descriptions
- **Multiple Sort Options**: Sort by newest, oldest, most/least members, A-Z, Z-A
- **Infinite Scroll**: Seamless loading of more servers as you scroll
- **Server Details Modal**: Click any server to view detailed information
- **Join Server**: Join servers directly or by invite code

### UI/UX Features
- **Discord-like Design**: Authentic Discord visual design and feel
- **Responsive Layout**: Works on desktop and mobile devices
- **Smooth Animations**: Polished transitions and hover effects
- **Toast Notifications**: User feedback for all actions
- **Loading States**: Visual feedback during data loading
- **Category Sidebar**: Quick navigation between server categories
- **Search & Sort Controls**: Intuitive search and sorting interface

### Technical Features
- **SQLite Database**: Self-contained database with automatic setup
- **PHP Backend API**: RESTful API endpoints for all operations
- **Real Database Queries**: Proper JOIN queries with member counts
- **Error Handling**: Comprehensive error handling and logging
- **Sample Data**: Pre-populated with 20 diverse servers
- **Session Management**: User session handling
- **XSS Protection**: HTML escaping for security

## 🗄️ Database Schema

The application uses a complete database schema based on the provided ERD:

- **Users**: User accounts and profiles
- **Server**: Server information and settings
- **ServerInfo**: Server categories and invite details
- **UserServerMemberships**: User-server relationships and roles
- **Channel**: Server channels (for future expansion)
- **FriendList**: User relationships (for future expansion)

## 🎯 Getting Started

### Prerequisites
- PHP 7.4 or higher
- Web browser with JavaScript enabled

### Installation

1. **Navigate to the server directory:**
   ```bash
   cd /workspace/user/server
   ```

2. **Start the development server:**
   ```bash
   php server.php
   ```
   
   Or specify a custom port:
   ```bash
   php server.php 8080
   ```

3. **Open your browser:**
   Navigate to `http://localhost:8000/user-explore.php`

### Alternative Setup

If you prefer to use a different web server:

1. **Set up your web server** to serve the `/workspace/user/server` directory
2. **Ensure PHP is enabled** with PDO and SQLite support
3. **Access the application** via your web server

## 📁 File Structure

```
/workspace/user/server/
├── user-explore.php      # Main application file (HTML + PHP API)
├── user-explore.css      # Discord-like styling
├── user-explore.js       # Frontend JavaScript logic
├── database.php          # Database connection and setup
├── server.php           # Development server runner
├── setup_database.sql   # MySQL schema (alternative)
├── discord_clone.db     # SQLite database (auto-created)
└── README.md           # This file
```

## 🎮 Sample Data

The application comes pre-loaded with 20 diverse servers across different categories:

### Gaming Servers
- Epic Gamers Hub - The ultimate gaming community
- Minecraft Builders - Creative builders and redstone engineers
- FPS Champions - Competitive FPS gaming community
- Retro Gaming - Nostalgia and classic games discussion

### Music Servers
- Melody Makers - Musicians, producers, and music lovers
- EDM Vibes - Electronic dance music community
- Classical Corner - Classical music appreciation society

### Technology Servers
- Code Academy - Learn programming and share knowledge
- AI & Machine Learning - AI and ML discussions
- Web Developers - Frontend, backend, and fullstack developers

### And more categories including Education, Art, Entertainment, Community, and Sports!

## 🔧 API Endpoints

The application provides several API endpoints:

- `POST /user-explore.php` with `action=get_servers` - Get paginated servers list
- `POST /user-explore.php` with `action=get_categories` - Get categories with counts
- `POST /user-explore.php` with `action=get_server_details` - Get detailed server info
- `POST /user-explore.php` with `action=join_server` - Join a server
- `POST /user-explore.php` with `action=join_by_invite` - Join server by invite code

## 🎨 Customization

### Adding New Categories
1. Insert new category data in the `ServerInfo` table
2. Add corresponding icon in the `getCategoryIcon()` function in `user-explore.js`

### Modifying Server Data
Edit the sample data in the `database.php` file's `insertSampleData()` method.

### Styling Changes
Modify the `user-explore.css` file to customize the Discord-like theme.

## 🔒 Security Features

- **SQL Injection Protection**: Using prepared statements
- **XSS Prevention**: HTML escaping for all user input
- **Session Management**: Proper session handling
- **Input Validation**: Server-side validation for all inputs

## 🚀 Performance Optimizations

- **Pagination**: Efficient server loading with pagination
- **Infinite Scroll**: Load more content on demand
- **Debounced Search**: Optimized search with 500ms debounce
- **Optimized Queries**: Efficient JOIN queries with member counts
- **Minimal Database Calls**: Smart caching and batching

## 🔧 Development

### Adding New Features
1. **Backend**: Add new actions to `user-explore.php`
2. **Frontend**: Extend JavaScript functionality in `user-explore.js`
3. **Styling**: Update CSS in `user-explore.css`

### Database Changes
1. **Modify Schema**: Update `database.php` for schema changes
2. **Migration**: Create migration scripts for existing databases
3. **Sample Data**: Update sample data as needed

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PHP PDO and SQLite extensions are installed
   - Ensure write permissions in the server directory

2. **Port Already in Use**
   - Use a different port: `php server.php 8001`
   - Check for existing processes on the port

3. **JavaScript Errors**
   - Ensure jQuery is loading properly
   - Check browser console for detailed error messages

4. **CSS Not Loading**
   - Verify file paths and web server configuration
   - Check for any CSS syntax errors

## 🌟 Live Demo

The application is fully functional and includes:

✅ **Real Database**: SQLite database with proper relationships  
✅ **Sample Data**: 20 pre-loaded servers across 8 categories  
✅ **Full Functionality**: Search, sort, filter, infinite scroll  
✅ **Interactive UI**: Click servers, join them, use invite codes  
✅ **Responsive Design**: Works on all screen sizes  
✅ **Error Handling**: Proper error messages and feedback  

## 📝 License

This project is created for educational purposes as a Discord clone demonstration.

## 🤝 Contributing

Feel free to fork this project and submit improvements! The codebase is well-structured and documented for easy extension.

---

**Enjoy exploring the Discord-like server browser!** 🎉