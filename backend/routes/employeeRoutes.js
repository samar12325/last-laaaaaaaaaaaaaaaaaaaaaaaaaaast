const express = require('express');
const router = express.Router();
const { 
    checkEmployeePermissions, 
    checkComplaintOwnership, 
    logEmployeeActivity 
} = require('../middleware/permissions');
const {
    getEmployeeProfile,
    createComplaint,
    getEmployeeComplaints,
    getComplaintDetails,
    addResponse,
    updateComplaintStatus,
    getNotifications,
    markNotificationAsRead
} = require('../controllers/employeeController');

// تطبيق middleware للصلاحيات على جميع المسارات
router.use(checkEmployeePermissions);

// الملف الشخصي للموظف
router.get('/profile', 
    logEmployeeActivity('view_profile', 'عرض الملف الشخصي'),
    getEmployeeProfile
);

// الشكاوى
router.post('/complaints', 
    logEmployeeActivity('create_complaint', 'إنشاء شكوى جديدة'),
    createComplaint
);

router.get('/complaints', 
    logEmployeeActivity('view_complaints', 'عرض قائمة الشكاوى'),
    getEmployeeComplaints
);

router.get('/complaints/:complaintId', 
    checkComplaintOwnership,
    logEmployeeActivity('view_complaint_details', 'عرض تفاصيل الشكوى', 'params.complaintId', 'complaint'),
    getComplaintDetails
);

router.post('/complaints/:complaintId/responses', 
    checkComplaintOwnership,
    logEmployeeActivity('add_response', 'إضافة رد على الشكوى', 'params.complaintId', 'complaint'),
    addResponse
);

router.put('/complaints/:complaintId/status', 
    checkComplaintOwnership,
    logEmployeeActivity('update_status', 'تحديث حالة الشكوى', 'params.complaintId', 'complaint'),
    updateComplaintStatus
);

// الإشعارات
router.get('/notifications', 
    logEmployeeActivity('view_notifications', 'عرض الإشعارات'),
    getNotifications
);

router.put('/notifications/:notificationId/read', 
    logEmployeeActivity('mark_notification_read', 'تحديث حالة الإشعار كمقروء', 'params.notificationId', 'notification'),
    markNotificationAsRead
);

module.exports = router;
