const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { logActivity } = require('../controllers/logsController');

// التحقق من صلاحيات الموظف
const checkEmployeePermissions = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token مطلوب للمصادقة'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // جلب بيانات المستخدم من قاعدة البيانات
        const [users] = await pool.execute(
            `SELECT e.*, r.RoleName 
             FROM Employees e 
             JOIN Roles r ON e.RoleID = r.RoleID 
             WHERE e.EmployeeID = ?`,
            [decoded.employeeID]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        const user = users[0];

        // التحقق من أن المستخدم موظف (RoleID = 2)
        if (user.RoleID !== 2) {
            await logActivity(
                user.EmployeeID,
                user.Username,
                'unauthorized_access',
                `محاولة وصول غير مصرح: ${req.originalUrl}`,
                req.ip,
                req.get('User-Agent'),
                null,
                'employee_panel'
            );

            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول لهذه الصفحة'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('خطأ في التحقق من صلاحيات الموظف:', error);
        return res.status(403).json({
            success: false,
            message: 'Token غير صالح'
        });
    }
};

// التحقق من ملكية الشكوى
const checkComplaintOwnership = async (req, res, next) => {
    try {
        const { complaintId } = req.params;
        const employeeId = req.user.EmployeeID;

        // التحقق من أن الشكوى تخص الموظف أو مسندة له
        const [complaints] = await pool.execute(
            `SELECT * FROM Complaints 
             WHERE ComplaintID = ? AND (EmployeeID = ? OR AssignedTo = ?)`,
            [complaintId, employeeId, employeeId]
        );

        if (complaints.length === 0) {
            await logActivity(
                req.user.EmployeeID,
                req.user.Username,
                'unauthorized_complaint_access',
                `محاولة وصول لشكوى غير مصرح: ${complaintId}`,
                req.ip,
                req.get('User-Agent'),
                complaintId,
                'complaint'
            );

            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول لهذه الشكوى'
            });
        }

        req.complaint = complaints[0];
        next();
    } catch (error) {
        console.error('خطأ في التحقق من ملكية الشكوى:', error);
        return res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// التحقق من الصفحات المحجوبة
const checkBlockedPages = async (req, res, next) => {
    const blockedPages = [
        '/general-complaints.html',
        '/dashboard.html',
        '/admin.html',
        '/admin/',
        '/department-management.html',
        '/recycle-bin.html',
        '/employee-data.html',
        '/logs.html'
    ];

    const currentPath = req.path;

    for (const blockedPage of blockedPages) {
        if (currentPath.includes(blockedPage)) {
            await logActivity(
                req.user.EmployeeID,
                req.user.Username,
                'blocked_page_access',
                `محاولة وصول لصفحة محجوبة: ${currentPath}`,
                req.ip,
                req.get('User-Agent'),
                null,
                'page_access'
            );

            return res.status(403).json({
                success: false,
                message: 'هذه الصفحة محجوبة على الموظفين'
            });
        }
    }

    next();
};

// تسجيل نشاط الموظف
const logEmployeeActivity = (activityType, description, relatedIDPath = null, relatedType = null) => {
    return async (req, res, next) => {
        try {
            let relatedID = null;
            
            // استخراج relatedID من req.params إذا تم تحديده
            if (relatedIDPath && req.params) {
                const pathParts = relatedIDPath.split('.');
                let value = req;
                for (const part of pathParts) {
                    if (value && value[part]) {
                        value = value[part];
                    } else {
                        value = null;
                        break;
                    }
                }
                relatedID = value;
            }

            await logActivity(
                req.user.EmployeeID,
                req.user.Username,
                activityType,
                description,
                req.ip,
                req.get('User-Agent'),
                relatedID,
                relatedType
            );
            next();
        } catch (error) {
            console.error('خطأ في تسجيل نشاط الموظف:', error);
            next();
        }
    };
};

module.exports = {
    checkEmployeePermissions,
    checkComplaintOwnership,
    checkBlockedPages,
    logEmployeeActivity
};
