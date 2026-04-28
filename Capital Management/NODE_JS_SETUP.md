# Capital Management System - Node.js Backend Setup

## ✅ What's Been Set Up

Your Node.js backend is now configured with the following structure:

```
├── server.js                 # Main Express server
├── init-db.js               # Database initialization script
├── package.json             # Node.js dependencies
├── .env                     # Environment variables
├── config/
│   └── database.js          # SQLite database configuration
├── models/                  # Database models
│   ├── User.js
│   ├── AssetRequest.js
│   ├── FundAllocation.js
│   ├── Notification.js
│   └── ContactReply.js
├── routes/                  # API endpoints
│   ├── auth.js              # Login, register, logout
│   ├── users.js             # User management
│   ├── assets.js            # Asset requests
│   ├── allocations.js       # Fund allocations
│   ├── notifications.js     # User notifications
│   └── contact.js           # Contact form replies
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── node_modules/            # Dependencies (auto-installed)
└── capital_management.db    # SQLite database (created on first run)
```

## 🚀 Quick Start

### Step 1: Initialize Database
```powershell
cd "g:\Shared drives\Tejas's Storage\Capital_Management\Capital Management"
npm run init-db
```

This will:
- Create `capital_management.db` SQLite database
- Create default tables
- Add sample users with different roles:
  - **Admin**: admin@capital.com / admin123
  - **Capital Master**: master@capital.com / master123
  - **Requester**: requester@capital.com / requester123
- Allocate funds to each capital type

### Step 2: Start the Server
```powershell
npm start
```

Server will run on `http://localhost:5000`

## 📋 Sample Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@capital.com | admin123 |
| Capital Master | master@capital.com | master123 |
| Requester | requester@capital.com | requester123 |

## 🔗 API Endpoints (21 Total)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout (optional)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Asset Requests
- `GET /api/assets` - Get asset requests
- `GET /api/assets/:id` - Get specific asset
- `POST /api/assets` - Create asset request
- `POST /api/assets/:id/approve` - Approve request (capital master)
- `POST /api/assets/:id/deny` - Deny request (capital master)

### Fund Allocations
- `GET /api/allocations` - Get all allocations
- `POST /api/allocations` - Create/update allocation
- `PUT /api/allocations/:capitalType` - Update allocated funds

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/clear-all` - Clear all

### Contact
- `POST /api/contact` - Submit contact message
- `GET /api/contact` - Get all messages (admin only)
- `POST /api/contact/:id/reply` - Reply to message (admin only)

## 📁 Frontend Integration

All HTML files are already set up with `api-client.js` which:
- Handles JWT token authentication automatically
- Makes API calls to this Node.js backend
- No changes needed to HTML files

The API calls will automatically use:
- Base URL: `http://localhost:5000`
- Authorization header with stored JWT token

## 🔐 Environment Variables

Edit `.env` file if needed:
```
PORT=5000                          # Server port
JWT_SECRET=your-secret-key         # Change this in production!
NODE_ENV=development
DATABASE_PATH=./capital_management.db
CORS_ORIGIN=*
```

## ⚠️ Important

1. **Change JWT_SECRET in production!** Currently uses default value
2. **Database is local SQLite** - stored in `capital_management.db`
3. **All HTML files work with this backend** - no changes needed
4. **CORS is enabled** - frontend can access API from any origin

## 🔧 Development Server

To run with auto-restart on file changes, install nodemon:
```powershell
npm install -D nodemon
npm run dev
```

## 📚 Available Scripts

```bash
npm run init-db    # Initialize database with sample data
npm start          # Start production server
npm run dev        # Start development server
```

## 🐛 Troubleshooting

### Server won't start
- Make sure port 5000 is not in use
- Check Node.js is installed: `node --version`
- Check npm: `npm --version`

### Database issues
- Delete `capital_management.db` and run `npm run init-db` again
- Check file permissions in the directory

### API returns 401 Unauthorized
- Frontend needs to login first to get JWT token
- Token is stored in `localStorage.token`
- Add "Bearer " prefix to Authorization header

## 🎯 Next Steps

1. ✅ Initialize database: `npm run init-db`
2. ✅ Start server: `npm start`
3. ✅ Open login.html in browser
4. ✅ Login with sample credentials
5. ✅ Test all features!

---

**Status**: ✅ Node.js backend fully configured and ready to use!
