const express = require('express');
const router = express.Router();

// Simple test endpoint without middleware
router.get('/profile', (req, res) => {
    res.json({
        success: true,
        message: 'Employee profile endpoint is working!',
        data: {
            EmployeeID: 1,
            FullName: 'Test Employee',
            Username: 'testuser',
            Email: 'test@example.com',
            RoleName: 'employee'
        }
    });
});

router.get('/complaints', (req, res) => {
    res.json({
        success: true,
        message: 'Employee complaints endpoint is working!',
        data: {
            complaints: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalComplaints: 0,
                complaintsPerPage: 10
            }
        }
    });
});

router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Employee routes are working!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
