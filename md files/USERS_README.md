# Capital Management - Users Management System

## Overview
The Users Management System is a comprehensive solution for managing user data in the Capital Management application. It provides both a web-based interface and Python-based backend management.

## Features

### Web-Based Users Page (`users.html`)
- **User Directory**: View all users in an organized table format
- **Add/Edit Users**: Create and modify user profiles with full details
- **Delete Users**: Remove inactive or unnecessary user accounts
- **Search & Filter**: Filter users by name, role, or status
- **Export to Excel**: Download all users data in Excel format
- **Import from Excel**: Upload user data from Excel/CSV files
- **Real-time Statistics**: View total, active, admin, and manager counts
- **Responsive Design**: Works on desktop and mobile devices

### Features:
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ User roles: Admin, Manager, User
- ✅ User status: Active, Inactive, Pending
- ✅ Excel import/export functionality
- ✅ Local storage persistence
- ✅ Advanced filtering and search
- ✅ Professional, modern UI

## Quick Start

### 1. Web Interface
Simply navigate to the Users page in your Budget Management system:
- Click on "Users" in the Admin section of the sidebar
- The users.html page will load with sample data

### 2. Using the Python Script (Optional)
For backend management and Excel operations:

#### Installation
```bash
pip install openpyxl
```

#### Usage
```bash
python users_manager.py
```

Follow the interactive menu:
```
1. View all users
2. Add new user
3. Update user
4. Delete user
5. Show statistics
6. Exit
```

## User Data Format

Users are stored with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique identifier |
| name | String | User's full name |
| email | String | Email address (unique) |
| phone | String | Contact phone number |
| role | String | Admin, Manager, or User |
| status | String | Active, Inactive, or Pending |
| joinedDate | Date | YYYY-MM-DD format |

## Data Storage Options

### Browser LocalStorage (Default)
- Data is stored locally in the browser
- No server required
- Data persists between sessions
- Separate for each browser/device

### Excel File (`users_data.xlsx`)
- Can be managed via the Python script
- Can be imported/exported through the web interface
- Suitable for backups and data transfer

### CSV File (`users_data.csv`)
- Plain text format for easy sharing
- Can be opened with any spreadsheet application
- Used as fallback import format

## User Roles & Permissions

### Admin
- Full system access
- Can manage all users
- Can access all features
- Can modify system settings

### Manager
- Can manage team members
- Can view reports
- Can approve certain operations
- Limited system access

### User
- Can access assigned features
- Can view own data only
- Cannot manage other users
- Read-only access to certain areas

## User Status

- **Active**: User account is active and can access the system
- **Inactive**: User account is disabled (cannot login)
- **Pending**: User account is awaiting approval

## Sample Data

The system comes with 10 sample users:
1. John Doe (Admin) - john.doe@capital.com
2. Sarah Smith (Manager) - sarah.smith@capital.com
3. Mike Johnson (User) - mike.johnson@capital.com
4. Lisa Anderson (Manager) - lisa.anderson@capital.com
5. David Wilson (User) - david.wilson@capital.com
6. Emily Brown (Manager) - emily.brown@capital.com
7. Robert Taylor (User) - robert.taylor@capital.com
8. Jennifer Lee (User) - jennifer.lee@capital.com
9. Charles Martin (Admin) - charles.martin@capital.com
10. Patricia Garcia (Manager) - patricia.garcia@capital.com

## How to Export Users to Excel

1. Navigate to the Users page
2. Click the "Export to Excel" button
3. File will download as `users_data.xlsx`
4. Open in Microsoft Excel, Google Sheets, or any spreadsheet application

## How to Import Users from Excel

### Prepare Your Excel File
Create a file with these columns:
- id (optional, will be auto-generated)
- name (required)
- email (required, must be unique)
- phone (optional)
- role (Admin/Manager/User)
- status (Active/Inactive/Pending)
- joinedDate (YYYY-MM-DD format)

### Import Steps
1. Navigate to the Users page
2. Click "Import from Excel"
3. Select your CSV or Excel file
4. Existing users with matching emails will be updated
5. New users will be added
6. Success message will show number of imported users

## Python Script Commands

### View all users
```bash
python users_manager.py
# Then select option 1
```

### Add a new user
```bash
python users_manager.py
# Then select option 2
# Answer prompts for user details
```

### Update existing user
```bash
python users_manager.py
# Then select option 3
# Enter user ID and fields to update
```

### Delete a user
```bash
python users_manager.py
# Then select option 4
# Enter user ID to delete
```

### View statistics
```bash
python users_manager.py
# Then select option 5
```

## File Structure

```
Capital_Management/
├── admin.html                          # Admin panel
├── Capital Management/
│   ├── users.html                      # Users management page
│   ├── users_data.csv                  # CSV format users data
│   ├── dashboard.html
│   ├── capitalmaster.html
│   ├── style.css
│   └── ... (other pages)
├── users_manager.py                    # Python backend management
└── users_data.xlsx                     # Excel format (created by export)
```

## Security Considerations

### For Production Use:
1. ⚠️ **Do NOT store passwords in the Excel file** - use a secure authentication system
2. 🔐 **Implement proper authentication** - validate user credentials
3. 🛡️ **Use HTTPS** - encrypt data in transit
4. 📋 **Audit Logging** - track all user management changes
5. 🔑 **Role-Based Access Control** - enforce permissions on backend
6. 🚨 **Validation** - validate all user inputs before saving

### Current Limitations:
- Browser localStorage has size limits (typically 5-10MB)
- No built-in encryption
- No authentication system
- No audit trail
- **For demo/development purposes only**

## Troubleshooting

### Users data not saving?
- Check if browser has localStorage enabled
- Try clearing cache and reloading
- Export to Excel to backup data

### Excel import not working?
- Ensure column headers match exactly
- Check file format (CSV, XLSX)
- Verify email addresses are unique

### Python script errors?
- Ensure openpyxl is installed: `pip install openpyxl`
- Check file permissions for users_data.xlsx
- Run from Capital_Management directory

## Integration with Other Modules

The Users page integrates with:
- **Admin Panel** - User management from admin dashboard
- **Dashboard** - Shows active user count
- **Audit Logs** - Tracks user-related activities
- **Permission System** - Enforces role-based access

## API Reference (Python Script)

### UsersManager Class

```python
# Initialize
manager = UsersManager('users_data.xlsx')

# Add user
manager.add_user(name, email, phone, role, status='Active')

# Update user
manager.update_user(user_id, name='John', status='Active')

# Delete user
manager.delete_user(user_id)

# Get all users
users = manager.get_all_users()

# Get statistics
stats = manager.get_user_stats()

# Save changes
manager.save()
```

## Support & Maintenance

For issues or feature requests:
1. Check the troubleshooting section
2. Review the integration points
3. Verify data format compliance
4. Test with sample data first

## Version History

**v1.0.0** - Initial Release
- Web-based user management
- Excel import/export
- Python backend management
- Role-based management
- Full CRUD operations

---

**Last Updated:** March 12, 2026
**Developed for:** Budget Management System
