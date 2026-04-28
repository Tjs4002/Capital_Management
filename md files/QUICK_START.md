# Users Management - Quick Start Guide

## What's Been Created

You now have a complete User Management System with three components:

### 1. **Web Interface** (`Capital Management/users.html`)
- A fully functional users management dashboard
- Accessible from the sidebar under Admin > Users
- Features: Add, Edit, Delete, Search, Filter, Export, Import users

### 2. **Excel Data File** (`users_data.xlsx`)
- Contains 10 sample users with realistic data
- Can be downloaded, edited, and re-imported
- Compatible with Excel, Google Sheets, and other spreadsheet tools

### 3. **Python Backend** (`users_manager.py`)
- Command-line tool for advanced user management
- Can be used for bulk operations, backups, and data management
- Includes interactive menu system

## Getting Started in 3 Steps

### Step 1: Open the Users Page
1. Open your Capital Management application
2. Click **"Users"** in the left sidebar (under Admin section)
3. The users page will load with 10 sample users

### Step 2: Try the Features
- **Search**: Type a name in the search bar to find users
- **Filter**: Filter by Role (Admin/Manager/User) or Status
- **Add User**: Click "+ Add User" to create a new user
- **Edit**: Click "Edit" on any user to modify their information
- **Delete**: Click "Delete" to remove a user
- **Export**: Download all users as an Excel file

### Step 3: Import/Export Data
- **Export to Excel**: Click "Export to Excel" to download users data
- **Import from Excel**: Click "Import from Excel" and select a file

## Sample Users Available

You have 10 users ready to use:

| Name | Email | Role | Status |
|------|-------|------|--------|
| John Doe | john.doe@capital.com | Admin | Active |
| Sarah Smith | sarah.smith@capital.com | Manager | Active |
| Mike Johnson | mike.johnson@capital.com | User | Active |
| Lisa Anderson | lisa.anderson@capital.com | Manager | Inactive |
| David Wilson | david.wilson@capital.com | User | Active |
| Emily Brown | emily.brown@capital.com | Manager | Active |
| Robert Taylor | robert.taylor@capital.com | User | Pending |
| Jennifer Lee | jennifer.lee@capital.com | User | Active |
| Charles Martin | charles.martin@capital.com | Admin | Active |
| Patricia Garcia | patricia.garcia@capital.com | Manager | Active |

## Real-time Statistics

The page shows live updates:
- **Total Users**: 10
- **Active Users**: 8
- **Admins**: 2
- **Managers**: 4

## User Roles Explained

### Admin
- Full system access
- Can manage all users
- Example: John Doe

### Manager
- Can manage team members
- Can approve operations
- Example: Sarah Smith

### User
- Basic access
- Can view own data
- Example: Mike Johnson

## User Statuses

- **Active**: Can log in and use the system
- **Inactive**: Account is disabled
- **Pending**: Awaiting approval

## Common Tasks

### Add a New User
1. Click **"+ Add User"** button
2. Fill in the form:
   - Full Name (required)
   - Email (required)
   - Phone (optional)
   - Role (Admin/Manager/User)
   - Status (Active/Inactive/Pending)
3. Click **"Save User"**

### Edit a User
1. Find the user in the table
2. Click **"Edit"** button
3. Modify the information
4. Click **"Save User"**

### Delete a User
1. Find the user in the table
2. Click **"Delete"** button
3. Confirm the deletion

### Export Users to Excel
1. Click **"Export to Excel"** button
2. File `users_data.xlsx` will download
3. Open in Excel to view or edit

### Import Users from Excel
1. Prepare your Excel/CSV file with columns:
   - name
   - email
   - phone
   - role
   - status
2. Click **"Import from Excel"**
3. Select your file
4. Users will be added or updated

## Using the Python Script (Optional)

If you want to manage users from the command line:

```bash
# Navigate to the project directory
cd Capital_Management

# Run the script
python users_manager.py
```

Follow the menu:
1. View all users
2. Add new user
3. Update user
4. Delete user
5. Show statistics
6. Exit

## Data Storage

Your users data is stored in:
- **Browser LocalStorage**: Automatically saved when you use the web interface
- **Excel File**: When you export/import data
- **Python Script**: Manages users_data.xlsx for backend operations

All data is persistent - it's saved even after closing the browser!

## Troubleshooting

### Users data disappeared?
- The data is stored in browser localStorage
- Try pressing F12 → Application → LocalStorage → (scroll to find site)
- Or export data before clearing browser cache

### Can't import Excel file?
- Make sure columns match: name, email, phone, role, status
- Email addresses must be unique
- Try saving as .csv instead of .xlsx

### Python script won't run?
- Make sure you're in the Capital_Management directory
- Check that openpyxl is installed: `pip install openpyxl`
- Use the full Python path if needed

## File Locations

```
Capital_Management/
├── admin.html                          # Admin panel
├── Capital Management/
│   ├── users.html                      # ← Users management page
│   ├── users_data.csv                  # Sample data in CSV
│   └── ...
├── users_manager.py                    # Python management tool
├── users_data.xlsx                     # Excel file with sample data
└── USERS_README.md                     # Full documentation
```

## Next Steps

1. ✅ Explore the users page and try adding/editing users
2. ✅ Export the sample data to Excel to see the format
3. ✅ Try importing a CSV file with your own data format
4. ✅ Link users to other modules (permissions, audit logs, etc.)
5. ✅ Customize the user roles and statuses as needed

## Tips & Tricks

### Create Backup
```bash
# Export to Excel to backup
# Click "Export to Excel" button
```

### Bulk Add Users
```bash
# Prepare an Excel file with users
# Click "Import from Excel"
# All users will be added at once
```

### Check Statistics
```bash
# Stats auto-update on the web page
# Or run: python users_manager.py → Option 5
```

### Reset to Sample Data
```bash
# Delete localStorage in browser
# Reload the page
# Sample data reloads automatically
```

## Integration Points

The Users Management system connects with:
- ✅ **Admin Panel** - Quick user management
- ✅ **Dashboard** - Shows active user count
- ✅ **Audit Logs** - Can track user actions
- ✅ **Permission System** - Enforces role-based access

## Support

For detailed information, see **USERS_README.md** for:
- Complete API reference
- Advanced configuration
- Security considerations
- Troubleshooting guide

---

**Ready to use!** 🚀

Open your Capital Management application and click **Users** in the sidebar to get started.

