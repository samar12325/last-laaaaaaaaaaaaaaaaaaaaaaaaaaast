const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // <-- تأكدي أن الملف الصحيح

// ✅ هذي نسخة مبسطة بدون checkUserPermissions عشان تتأكدي تشتغل
router.get('/latest', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const [rows] = await pool.execute(`
      SELECT Username, ActivityType, Description, CreatedAt
      FROM activitylogs
      ORDER BY CreatedAt DESC
      LIMIT ?
    `, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching latest logs:', err);
    res.status(500).json({ success: false, message: 'Error fetching logs' });
  }
});

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const [rows] = await pool.execute(`
      SELECT Username, ActivityType, Description, CreatedAt
      FROM activitylogs
      ORDER BY CreatedAt DESC
      LIMIT ?
    `, [limit]);
    res.json({ data: rows });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ success: false, message: 'Error fetching logs' });
  }
});

module.exports = router;
