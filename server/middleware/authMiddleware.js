module.exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); // เปลี่ยนเส้นทางไปยังหน้าล็อกอินถ้ายังไม่เข้าสู่ระบบ
};
