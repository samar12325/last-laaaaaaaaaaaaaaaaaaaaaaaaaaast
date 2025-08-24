const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token مطلوب للمصادقة'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // جلب بيانات المستخدم من قاعدة البيانات
        const [users] = await db.execute(
            'SELECT * FROM Employees WHERE EmployeeID = ?',
            [decoded.employeeID]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({
            success: false,
            message: 'Token غير صالح'
        });
    }
};

module.exports = {
    authenticateToken
};
