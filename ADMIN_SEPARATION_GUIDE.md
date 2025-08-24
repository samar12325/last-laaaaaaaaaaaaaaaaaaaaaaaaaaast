# Admin System Separation Guide

## Overview

The admin system has been separated into two distinct roles with different access levels and capabilities:

1. **Super Admin (RoleID = 1)** - Global system management
2. **Department Admin (RoleID = 3)** - Department-scoped management

## Super Admin System

### Location
- **Files**: `superadmin/` directory
- **Main Page**: `superadmin/superadmin-home.html`
- **Access Control**: RoleID = 1 only

### Features
- **Global Analytics Dashboard** - Overview of all departments
- **Admin Control Panel** - User, role, and permission management
- **System Logs** - All system activity logs
- **Backup & Restore** - Database management
- **System Settings** - Global configuration

### Access Control
```javascript
// Check in superadmin-home.js
function requireSuperAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || Number(user.RoleID) !== 1) {
    window.location.replace('/login/home.html');
    return false;
  }
  return true;
}
```

### API Endpoints
- Uses existing API routes in `backend/`
- No additional endpoints needed (uses global routes)

## Department Admin System

### Location
- **Files**: `dept-admin/` directory
- **Main Page**: `dept-admin/dept-admin.html`
- **Access Control**: RoleID = 3 only

### Features
- **Department Dashboard** - Overview of department complaints
- **Department Employees** - Manage employees within department
- **Department Complaints** - View and manage department complaints
- **Complaint Assignment** - Assign complaints to department employees
- **Department Logs** - Activity logs for department employees
- **Permission Management** - Manage employee permissions within department

### Access Control
```javascript
// Check in dept-admin.js
function checkDepartmentAdminAccess() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || Number(user.RoleID) !== 3) {
    alert('Access denied. Only Department Admins can access this page.');
    window.location.replace('/login/home.html');
    return false;
  }
  
  currentUser = user;
  userDepartmentId = user.DepartmentID;
  return true;
}
```

### API Endpoints
All department admin endpoints are prefixed with `/api/dept-admin/` and include department filtering:

- `GET /api/dept-admin/department-employees/:departmentId`
- `GET /api/dept-admin/department-employees/:departmentId/permissions`
- `GET /api/dept-admin/complaints/department/:departmentId`
- `GET /api/dept-admin/complaints/department/:departmentId/assignment`
- `GET /api/dept-admin/complaints/department/:departmentId/latest`
- `GET /api/dept-admin/logs/department/:departmentId`
- `GET /api/dept-admin/overview/department/:departmentId`
- `POST /api/dept-admin/complaints/:complaintId/assign`

## Database Integration

### Super Admin
- Accesses all data across all departments
- No department filtering applied
- Full system-wide permissions

### Department Admin
- All queries filtered by `DepartmentID`
- Can only access data from their assigned department
- Department-scoped permissions only

### Security Features
1. **Role-based Access Control**: Each system checks for correct RoleID
2. **Department Isolation**: Department admins can only access their department data
3. **API Protection**: All endpoints verify user permissions and department access
4. **Token Authentication**: JWT tokens required for all API calls

## File Structure

```
project/
├── superadmin/                    # Super Admin System
│   ├── superadmin-home.html      # Main dashboard
│   ├── superadmin-home.js        # Dashboard logic
│   ├── superadmin-home.css       # Dashboard styles
│   ├── superadmin.html           # Admin panel
│   ├── superadmin.js             # Admin logic
│   ├── superadmin.css            # Admin styles
│   ├── logs.html                 # System logs
│   ├── logs.js                   # Logs logic
│   ├── logs.css                  # Logs styles
│   ├── permissions.html          # Permissions management
│   ├── permissions.js            # Permissions logic
│   └── permissions.css           # Permissions styles
├── dept-admin/                   # Department Admin System
│   ├── dept-admin.html           # Main dashboard
│   ├── dept-admin.js             # Dashboard logic
│   └── dept-admin.css            # Dashboard styles
└── backend/
    ├── routes/
    │   └── deptAdminRoutes.js    # Department admin API routes
    └── app.js                    # Updated with new routes
```

## Usage Instructions

### For Super Admins (RoleID = 1)
1. Navigate to `/superadmin/superadmin-home.html`
2. Access global system management features
3. Manage all users, departments, and system settings

### For Department Admins (RoleID = 3)
1. Navigate to `/dept-admin/dept-admin.html`
2. Access department-scoped management features
3. Manage only employees and complaints within their department

### Navigation
- **Super Admin Links**: Point to `/superadmin/` pages
- **Department Admin Links**: Point to `/dept-admin/` pages
- **Employee Links**: Point to `/employee/` pages

## Design Consistency

Both systems maintain the same design language:
- **Colors**: Blue gradient theme (#172F4A to #3BAAE0)
- **Typography**: Tajawal (Arabic) and Merriweather (English)
- **Layout**: Card-based dashboard with hover effects
- **Responsive**: Mobile-friendly design
- **Language Support**: Bilingual (Arabic/English)

## Security Considerations

1. **Access Control**: Each system validates RoleID on page load
2. **API Protection**: All endpoints verify user permissions
3. **Department Isolation**: Department admins cannot access other departments
4. **Token Validation**: JWT tokens required for all operations
5. **Error Handling**: Proper error messages for unauthorized access

## Database Schema

The system uses existing database tables:
- `Employees` - User accounts with RoleID and DepartmentID
- `Roles` - Role definitions (1=Super Admin, 2=Employee, 3=Department Admin)
- `Departments` - Department information
- `Complaints` - Complaint data with DepartmentID filtering
- `ActivityLogs` - System activity logs

## API Response Format

All API endpoints return consistent JSON responses:
```json
{
  "success": true,
  "data": [...],
  "message": "Operation completed successfully"
}
```

## Error Handling

- **403 Forbidden**: Unauthorized access attempts
- **404 Not Found**: Invalid endpoints or resources
- **500 Internal Server Error**: Server-side errors
- **User-friendly Messages**: Clear error messages in Arabic/English

## Future Enhancements

1. **Audit Logging**: Track all admin actions
2. **Advanced Permissions**: Granular permission system
3. **Department Hierarchies**: Support for nested departments
4. **Real-time Notifications**: Live updates for admins
5. **Export Features**: Data export capabilities
6. **Advanced Analytics**: Detailed reporting and insights
