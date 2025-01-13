// ใน middleware/userActivityLogger.js 
const UserActivity = require('../models/UserActivity');

const userActivityLogger = async (req, res, next) => {
  try {
    const activity = new UserActivity({
      user_id: req.user ? req.user._id : null, // เก็บ user_id ถ้า user login แล้ว
      activity_type: req.method + ' ' + req.originalUrl, // เช่น 'GET /space'
      // เพิ่มเติมข้อมูลอื่นๆ ตามต้องการ เช่น IP address
    });
    await activity.save();
  } catch (error) {
    console.error('Error logging user activity:', error);
    // จัดการ error เช่น ส่ง error ไปยัง monitoring service
  } finally {
    next();
  }
};

module.exports = userActivityLogger;