# Node.js Backend - Quick Start Guide

## 🚀 Setup Steps (3 Simple Steps)

### Step 1: Wait for NPM Install to Complete

The npm packages are being installed in the background. This may take 2-5 minutes.

While waiting, you can review the backend files that have been created in your `Capital Management` folder.

### Step 2: Initialize the Database

Once npm finishes, open PowerShell and run:

```powershell
cd "g:\Shared drives\Tejas's Storage\Capital_Management\Capital Management"
npm run init-db
```

**Expected output:**
```
✅ Database synchronized
📝 Creating admin user...
✅ Admin user created
✅ Database initialization complete!
```

### Step 3: Start the Server

```powershell
npm start
```

**Expected output:**
```
🚀 Server running on http://localhost:5000
📝 Database: SQLite at ./capital_management.db
```

## ✅ After Setup

1. **Open Frontend**: Open `login.html` in your browser
2. **Choose a User** to login with:
   - Admin: `admin@capital.com` / `admin123`
   - Capital Master: `master@capital.com` / `master123`
   - Requester: `requester@capital.com` / `requester123`

## 📁 What Was Created

### Backend Files
- ✅ `server.js` - Main Express server
- ✅ `init-db.js` - Database initializer
- ✅ `package.json` - Dependencies list
- ✅ `.env` - Environment configuration
- ✅ `config/database.js` - Database setup
- ✅ `models/` - Database models (User, AssetRequest, etc.)
- ✅ `routes/` - 21 API endpoints
- ✅ `middleware/auth.js` - JWT authentication

### Configuration
- ✅ SQLite database (auto-created)
- ✅ JWT authentication ready
- ✅ CORS enabled for frontend access
- ✅ All 21 API endpoints configured

## 🎯 API Features Ready

✅ User registration & login
✅ Asset request management
✅ Fund allocation system
✅ Approval/denial workflow
✅ Notifications system
✅ Contact form handling
✅ User management dashboard

## 🔐 Security

- Passwords are hashed with bcryptjs
- JWT tokens for authentication
- Role-based access control (admin, capital_master, requester)
- CORS configured for your frontend

## ⚠️ Important Notes

1. **Keep the terminal running** - Server must be running to use the app
2. **Default JWT Secret** - Change in `.env` for production
3. **SQLite Database** - Local file `capital_management.db`
4. **Port 5000** - Make sure nothing else uses this port

## 🆘 If Something Goes Wrong

**Packages didn't install?**
```powershell
cd "g:\Shared drives\Tejas's Storage\Capital_Management\Capital Management"
npm install
```

**Database error?**
```powershell
Remove-Item capital_management.db -ErrorAction SilentlyContinue
npm run init-db
```

**Port already in use?**
Edit `.env` and change `PORT=5001` (or another number)

---

**Ready?** Follow the 3 steps above and you're good to go! 🎉
