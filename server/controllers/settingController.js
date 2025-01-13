const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const User = require("../models/User");
const multer = require('multer');
const path = require('path');

module.exports.setting_get = async (req, res) => {
    try {
        res.render("setting/setting-profile", {
            userName: req.user.username,
            userImage: req.user.profileImage,
            userId: req.user._id, // เพิ่ม userId นี้
            layout: "../views/layouts/setting",
        })
    } catch (error) {
        console.log(error)
    }
}

// Set storage engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

  // Init Upload
  const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Limit file size to 1MB
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
  }).single('profileImage');

  // Check File Type
  function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }

// Update user profile image
module.exports.edit_Update_profileImage = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            // เมื่อเกิด error ในการอัปโหลดไฟล์
            // แสดงข้อความ error ในรูปแบบของ alert บนเว็บไซต์
            res.send('<script>alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err + '"); window.location="/setting";</script>');
        } else {
            if (req.file == undefined) {
                // กรณีไม่ได้อัปโหลดไฟล์
                // แสดงข้อความ error ในรูปแบบของ alert บนเว็บไซต์
                res.send('<script>alert("ไม่ได้เลือกไฟล์! กรุณาเลือกไฟล์รูปภาพ"); window.location="/setting";</script>');
            } else {
                try {
                    // Update user profile image in database
                    const user = await User.findById(req.params.id);
                    user.profileImage = '/uploads/' + req.file.filename;
                    await user.save();
                    // หลังจากที่บันทึกข้อมูลเสร็จสิ้น
                    // แสดงข้อความ success ในรูปแบบของ alert บนเว็บไซต์
                    res.send('<script>alert("อัปโหลดรูปภาพสำเร็จ"); window.location="/setting";</script>');
                } catch (error) {
                    console.log(error);
                    // กรณีเกิด error ในการบันทึกข้อมูลในฐานข้อมูล
                    // แสดงข้อความ error ในรูปแบบของ alert บนเว็บไซต์
                    res.send('<script>alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message + '"); window.location="/setting";</script>');
                }
            }
        }
    });
};

// Update username
module.exports.edit_Update_username = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            // Handle user not found error
            return res.status(404).render('error', { message: 'ไม่พบผู้ใช้' }); // Render the error page with a clear message
        }
        user.username = req.body.username;
        await user.save();
        res.redirect('/setting');
    } catch (error) {
        console.log(error);
        res.status(500).render('error', { message: 'ข้อผิดพลาดของเซิร์ฟเวอร์' }); // Render the error page with a clear message
    }
};