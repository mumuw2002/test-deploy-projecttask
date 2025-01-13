// adminController.js
const passport = require('passport');
const SystemAnnouncement = require('../models/SystemAnnouncements');
const User = require('../models/User');
const Notification = require('../models/Noti');
const Complaint = require('../models/Complaint');
const marked = require('marked');
const multer = require('multer');
const path = require('path');
const { sendEmail } = require("../../emailService");
const moment = require('moment');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/img/profileImage')); // เปลี่ยน path ให้ตรงกับโครงสร้างโฟลเดอร์ของคุณ
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

exports.adminPage = async (req, res, next) => {
    try {
        // 1. จำนวนผู้ใช้งาน
        const totalUsersCount = await User.countDocuments();
        // **จำนวนผู้ใช้งานที่ใช้งานอยู่ในปัจจุบัน (Active Users)**
        const onlineUsersCount = await User.countDocuments({ 
            lastActive: { $gte: moment().subtract(5, 'minutes').toDate() } 
        }); // Active in the last 15 minutes
        // คำนวณจำนวนผู้ใช้งานใหม่ในแต่ละวันของสัปดาห์ที่ผ่านมา
        const newUserCounts = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: moment().subtract(7, 'days').startOf('day').toDate(),
                        $lte: moment().endOf('day').toDate()
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. รายงานปัญหาจากผู้ใช้งาน
        const totalComplaintsCount = await Complaint.countDocuments();
        const openComplaintsCount = await Complaint.countDocuments({ status: 'Open' });
        const inProgressComplaintsCount = await Complaint.countDocuments({ status: 'In Progress' });

        // จำนวนปัญหาแต่ละประเภท
        const complaintCategories = await Complaint.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3.  ผู้ใช้ที่เห็นประกาศระบบ (สมมติว่าการเห็นประกาศคือการมี Notification ที่ status เป็น 'accepted')
        const totalAnnouncements = await SystemAnnouncement.countDocuments();
        const seenAnnouncementsCount = await Notification.countDocuments({ type: 'announcement', status: 'accepted' });
        const seenPercentage = totalAnnouncements > 0 ? (seenAnnouncementsCount / totalAnnouncements) * 100 : 0;

         // 5. การใช้งานระบบ (System Usage) - สมมติว่าใช้ lastActive เป็นตัววัดการใช้งาน
         const systemUsage = await User.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d %H:00", date: "$lastActive" } // จัดกลุ่มตามวันและชั่วโมง
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // เรียงลำดับตามวันและเวลา
        ]);

        res.render('admin/Dashboard_admin', {
            title: 'Admin Page',
            user: req.user,
            layout: "../views/layouts/adminPage",

            // ข้อมูลสำหรับแดชบอร์ด
            totalUsersCount,
            onlineUsersCount,            
            newUserCounts,
            totalComplaintsCount,
            openComplaintsCount,
            inProgressComplaintsCount,
            complaintCategories,
            seenAnnouncementsCount,
            seenPercentage,
            systemUsage
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        req.flash('error', 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด');
        res.redirect('/admin/adminPage');
    }
};

exports.SystemAnnouncements = async (req, res, next) => {
    try {
        const now = new Date();
        const announcements = await SystemAnnouncement.find({ expirationDate: { $gte: now }, isDeleted: false })
            .populate({
                path: 'createdBy',
                select: 'username role',
                match: { role: 'admin' }
            })
            .sort({ createdAt: -1 });

        const userCounts = await User.countDocuments({
            role: 'user',
            "preferences.notifications.email": true
        });

        res.render('admin/SystemAnnouncements_admin', {
            title: 'System Announcements',
            user: req.user,
            announcements,
            userCounts,
            layout: "../views/layouts/adminPage"
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        req.flash('error', 'ไม่สามารถโหลดรายการประกาศได้');
        res.redirect('/admin/adminPage');
    }
};

exports.pageaddAnnouncements = (req, res, next) => {
    res.render('admin/SystemAnnouncements_admin/addSystemAnnouncements', {
        title: 'Admin Page',
        user: req.user,
        layout: "../views/layouts/adminPage"
    });
};

exports.createAnnouncements = async (req, res, next) => {
    try {
        const { title, content, expirationDate } = req.body;

        const users = await User.find({
            role: 'user',
            "preferences.notifications.email": true
        }).select('googleEmail _id');

        const emailAddresses = users.map(user => user.googleEmail);
        const recipients = users.map(user => user._id);

        const newAnnouncement = new SystemAnnouncement({
            createdBy: req.user._id,
            title,
            content,
            expirationDate,
            targetAudience: 'user',
            recipients,
        });

        await newAnnouncement.save();
        console.log('ประกาศถูกสร้างสำเร็จ:', newAnnouncement);

        // สร้าง Notification สำหรับผู้ใช้ทุกคนที่มี role เป็น 'user'
        const allUsers = await User.find({ role: 'user' }); // เปลี่ยนชื่อตัวแปรเป็น allUsers
        const notificationPromises = allUsers.map(user => {
            const notification = new Notification({
                user: user._id,
                type: 'announcement',
                announcement: newAnnouncement._id,
                leader: req.user._id,
                status: 'accepted',
            });
            return notification.save();
        });
        await Promise.all(notificationPromises);

        if (emailAddresses.length > 0) {
            const emailSubject = `ประกาศใหม่: ${title}`;

            // แปลง content เป็น HTML ก่อนส่งอีเมล
            const emailBody = `
                <h1>${title}</h1>
                <p>${marked.parse(content)}</p> 
                <p>ประกาศนี้จะหมดอายุในวันที่ ${new Date(expirationDate).toLocaleDateString()}</p>
            `;

            const emailPromises = emailAddresses.map(email =>
                sendEmail(email, emailSubject, emailBody)
            );
            await Promise.all(emailPromises);
            console.log('ส่งอีเมลสำเร็จ');
        } else {
            console.log('ไม่มีผู้ใช้ที่เปิดใช้งานการแจ้งเตือนทางอีเมล');
        }

        req.flash('success', 'สร้างประกาศสำเร็จและส่งอีเมลแจ้งเตือนแล้ว');
        res.redirect('/SystemAnnouncements');
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการสร้างประกาศ:', error);
        req.flash('error', 'เกิดข้อผิดพลาดในการสร้างประกาศ');
        res.redirect('/SystemAnnouncements/pageaddAnnouncements');
    }
};

exports.sendUnexpiredAnnouncementsToNewUser = async (userEmail) => {
    try {
        const activeAnnouncements = await SystemAnnouncement.find({
            expirationDate: { $gte: new Date() },
            isDeleted: false
        });

        if (activeAnnouncements.length > 0) {
            const emailPromises = activeAnnouncements.map(announcement => {
                const emailSubject = `ประกาศที่ยังไม่หมดอายุ: ${announcement.title}`;

                // แปลง content เป็น HTML ก่อนส่งอีเมล (ควรใช้ announcement.content)
                const emailBody = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <style>
                        body {
                          font-family: sans-serif;
                        }
                        .content-preview {
                          height: 350px;
                          overflow-y: scroll;
                          padding: 10px;
                          font-size: 16px;
                          color: #555;
                          line-height: 1.6;
                          border-radius: 10px;
                        }
                      </style>
                    </head>
                    <body>
                      <h1>${announcement.title}</h1> 
                      <p>${marked.parse(announcement.content)}</p> 
                      <p>ประกาศนี้จะหมดอายุในวันที่ ${new Date(announcement.expirationDate).toLocaleDateString()}</p>
                    </body>
                    </html>
                `;
                return sendEmail(userEmail, emailSubject, emailBody);
            });

            const results = await Promise.allSettled(emailPromises);
            console.log('ส่งอีเมลสำเร็จสำหรับผู้ใช้ใหม่:', userEmail);
        } else {
            console.log('ไม่มีประกาศที่ยังไม่หมดอายุสำหรับผู้ใช้ใหม่');
        }

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการส่งอีเมล:', error);
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await SystemAnnouncement.findByIdAndUpdate(
            id,
            { isDeleted: true, updatedAt: new Date() },
            { new: true }
        );
        if (!result) {
            return res.status(404).json({ success: false, message: 'ไม่พบประกาศนี้' });
        }
        res.json({ success: true, message: 'ลบประกาศเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบประกาศ' });
    }
};

exports.historySystemAnnouncements = async (req, res, next) => {
    try {
        const { searchTerm } = req.query; // รับค่า searchTerm จาก query parameter

        let filter = { isDeleted: true }; // เริ่มต้นด้วย filter สำหรับประกาศที่ถูกลบ

        if (searchTerm) { // ถ้ามี searchTerm ให้เพิ่ม filter
            filter.title = { $regex: searchTerm, $options: 'i' };
        }

        const deletedAnnouncements = await SystemAnnouncement.find(filter) // เพิ่ม filter ที่มีเงื่อนไขการค้นหา
            .populate({
                path: 'createdBy',
                select: 'username role',
                match: { role: 'admin' }
            })
            .sort({ updatedAt: -1 });

        res.render('admin/SystemAnnouncements_admin/historySystemAnnouncements', {
            title: 'History of Deleted Announcements',
            user: req.user,
            deletedAnnouncements,
            layout: "../views/layouts/adminPage"
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
    }
}

exports.ReportUserProblem = async (req, res, next) => {
    try {
        const complaints = await Complaint.find().populate('userId').sort({ submittedAt: -1 });
        res.render('admin/ReportUserProblem_admin', {
            title: 'Report a user problem',
            user: req.user,
            complaints: complaints, // ส่ง complaints ไปยัง template
            layout: '../views/layouts/adminPage'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
    }
};

exports.updateReportUserProblem = async (req, res, next) => {
    try {
        const complaintId = req.params.id; // รับ id จาก URL parameter
        const complaint = await Complaint.findById(complaintId).populate('userId');

        if (!complaint) {
            return res.status(404).send('ไม่พบรายงานปัญหา');
        }

        res.render('admin/ReportUserProblem_admin/updateReportUserProblem', {
            title: 'Update Report User Problem',
            user: req.user,
            complaint: complaint, // ส่ง complaint ไปยัง template
            layout: '../views/layouts/adminPage'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
    }
};

exports.SettingAdmin = (req, res, next) => {
    res.render('admin/SettingAdmin_admin', {
        title: 'Setting Adminstator',
        user: req.user,
        layout: '../views/layouts/adminPage'
    });
};

exports.updateProfileImage = [
    upload.single('profileImage'), // ใช้ middleware upload.single()
    async (req, res, next) => {
        try {
            if (req.file) {
                const updatedUser = await User.findByIdAndUpdate(
                    req.user._id,
                    { profileImage: '/img/profileImage/' + req.file.filename }, // อัปเดต path ของรูปโปรไฟล์
                    { new: true }
                );
                if (updatedUser) {
                    req.flash('success', 'อัปเดตรูปโปรไฟล์สำเร็จ');
                    res.redirect('/SettingAdmin');
                } else {
                    req.flash('error', 'อัปเดตรูปโปรไฟล์ไม่สำเร็จ');
                    res.redirect('/SettingAdmin');
                }
            } else {
                req.flash('error', 'กรุณาเลือกรูปโปรไฟล์');
                res.redirect('/SettingAdmin');
            }
        } catch (error) {
            console.error('Error updating profile image:', error);
            req.flash('error', 'เกิดข้อผิดพลาดในการอัปเดตรูปโปรไฟล์');
            res.redirect('/SettingAdmin');
        }
    }
];

exports.changePassword = async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        req.flash('error', 'รหัสผ่านใหม่ไม่ตรงกัน');
        return res.redirect('/admin/SettingAdmin');
    }

    // ตรวจสอบความซับซ้อนของรหัสผ่าน (เพิ่ม logic ตรวจสอบตามต้องการ)
    if (newPassword.length < 8) {
        req.flash('error', 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
        return res.redirect('/admin/SettingAdmin');
    }

    try {
        // ใช้ passport ในการเปลี่ยนรหัสผ่าน
        await new Promise((resolve, reject) => {
            req.user.changePassword(currentPassword, newPassword, (err, user) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            });
        });

        req.flash('success', 'เปลี่ยนรหัสผ่านสำเร็จ');
        res.redirect('/admin/SettingAdmin');
    } catch (error) {
        console.error('Error changing password:', error);
        req.flash('error', 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        res.redirect('/admin/SettingAdmin');
    }
};

exports.UserAccountManagement = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }); // ดึงข้อมูลผู้ใช้ทั้งหมดที่ไม่ใช่ admin
        res.render('admin/UserAccountManagement_admin.ejs', {
            title: 'User Account Management Adminstator',
            user: req.user,
            users: users,
            layout: '../views/layouts/adminPage'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
    }
};

exports.editUser = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        req.flash('error', 'ไม่พบผู้ใช้');
        return res.redirect('/admin/UserAccountManagement');
      }
      res.render('admin/userEdit', { 
        title: 'Edit User', 
        user: req.user, 
        editUser: user, // ส่งข้อมูลผู้ใช้ที่จะแก้ไขไปยัง view
        layout: '../views/layouts/adminPage' 
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
      res.redirect('/admin/UserAccountManagement');
    }
  };
  
  // ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้
  exports.updateUser = async (req, res) => {
    try {
      const { username, googleEmail } = req.body;
      const userId = req.params.id;
  
      // ตรวจสอบว่ามีผู้ใช้ที่มี username หรือ email ซ้ำหรือไม่ (ยกเว้นผู้ใช้ปัจจุบันที่กำลังแก้ไข)
      const existingUser = await User.findOne({ 
        $or: [{ username: username }, { googleEmail: googleEmail }], 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        req.flash('error', 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว');
        return res.redirect(`/admin/users/${userId}/edit`);
      }
  
      const updatedUser = await User.findByIdAndUpdate(userId, { 
        username: username, 
        googleEmail: googleEmail 
      }, { new: true });
  
      if (updatedUser) {
        req.flash('success', 'แก้ไขข้อมูลผู้ใช้สำเร็จ');
        res.redirect('/admin/UserAccountManagement');
      } else {
        req.flash('error', 'แก้ไขข้อมูลผู้ใช้ไม่สำเร็จ');
        res.redirect(`/admin/users/${userId}/edit`);
      }
    } catch (err) {
      console.error(err);
      req.flash('error', 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้');
      res.redirect('/admin/UserAccountManagement');
    }
  };
  
  // ฟังก์ชันสำหรับลบผู้ใช้ (แก้ไขเป็น DELETE request)
  exports.deleteUser = async (req, res) => {
    try {
      const userId = req.params.id;
      const deletedUser = await User.findByIdAndRemove(userId);
      if (!deletedUser) {
        return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
      }
      res.json({ success: true, message: 'ลบผู้ใช้เรียบร้อยแล้ว' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
    }
  };
  
  exports.resetPassword = async (req, res) => {
    try {
      const userId = req.params.id;
      const userEmail = req.body.email; // รับ email จาก request body
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
      }
  
      // Generate reset token (using crypto module)
      const resetToken = crypto.randomBytes(20).toString('hex');
  
      // Save reset token and expiration to user document
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();
  
      // Send reset password email (using emailService)
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
      const emailSubject = 'Reset Password Request';
      const emailBody = `
        <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following link, or paste this into your browser to complete the process:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in one hour.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `;
  
      const mailSent = await sendEmail(userEmail, emailSubject, emailBody);
  
      if (mailSent) {
        res.json({ success: true, message: 'ส่ง email reset password สำเร็จ' });
      } else {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่ง email' });
      }
  
    } catch (error) {
      console.error('Error sending reset password email:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่ง email' });
    }
  };
   

exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error logging out");
        }
        req.session.destroy((error) => {
            if (error) {
                console.error(error);
                return res.status(500).send("Error logging out");
            }
            res.redirect("/");
        });
    });
};


