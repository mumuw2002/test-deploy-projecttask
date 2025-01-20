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
const crypto = require('crypto');

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
        const complaintsByCategoryAndStatus = await Complaint.aggregate([
            {
                $group: {
                    _id: { category: "$category", status: "$status" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.category",
                    statuses: {
                        $push: {
                            status: "$_id.status",
                            count: "$count"
                        }
                    }
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
        console.log(complaintsByCategoryAndStatus)
        res.render('admin/Dashboard_admin', {
            title: 'Admin Page',
            user: req.user,
            layout: "../views/layouts/adminPage",

            // ข้อมูลสำหรับแดชบอร์ด
            totalUsersCount,
            onlineUsersCount,
            newUserCounts,
            totalAnnouncements,
            openComplaintsCount,
            inProgressComplaintsCount,
            complaintsByCategoryAndStatus,
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

exports.getCountByStatus = async (category, status) => {
    try {
        const count = await Complaint.countDocuments({ category: category, status: status });
        return count;
    } catch (error) {
        console.error("Error getting count by status:", error);
        return 0;
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
        const notificationPromises = allUsers.map(async (user) => {
            const notification = new Notification({
                user: user._id,
                type: 'announcement',
                announcement: newAnnouncement._id,
                leader: req.user._id,
                status: 'accepted',
            });
            try {
                await notification.save();
            } catch (err) {
                console.error(err);
            }
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
        const complaints = await Complaint.find({ status: { $ne: 'Closed' } }).populate('userId').sort({ submittedAt: -1 });
        res.render('admin/ReportUserProblem_admin', {
            title: 'Report a user problem',
            user: req.user,
            complaints: complaints,
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

exports.ClosedReportUserProblem = async (req, res, next) => {
    try {
        const closedComplaints = await Complaint.find({ status: 'Closed' }).populate('userId').sort({ resolvedAt: -1 });
        res.render('admin/ReportUserProblem_admin/closeReportUserProblem', {
            title: 'Closed Report User Problem',
            user: req.user,
            closedComplaints: closedComplaints, // <-- Make sure this is here
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
    const { currentPassword, newPassword } = req.body;

    // ตรวจสอบความซับซ้อนของรหัสผ่าน (เพิ่ม logic ตรวจสอบตามต้องการ) 
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' });
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

        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    }
};

exports.getLoginHistory = async (req, res, next) => {
    try {
        const adminUser = await User.findById(req.user._id).select('lastLogin lastActive');
        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ดูแลระบบ' });
        }

        res.json({
            success: true,
            data: {
                lastLogin: adminUser.lastLogin,
                lastActive: adminUser.lastActive,
            },
        });
    } catch (error) {
        console.error('Error fetching login history:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการเข้าสู่ระบบ' });
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

// ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้
exports.updateusersmanage = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const { userId, newUsername } = req.body;

        // ตรวจสอบว่ามี userId และ newUsername หรือไม่
        if (!userId || !newUsername) {
            return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username: newUsername },
            { new: true }
        );

        if (updatedUser) {
            res.json({ success: true, message: 'อัปเดตชื่อผู้ใช้สำเร็จ' });
        } else {
            res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด...' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiration = Date.now() + 86400000; // 1 day

        user.resetToken = resetToken;
        user.resetTokenExpiration = resetTokenExpiration;

        // Save the user using async/await
        await user.save();

        const resetPasswordUrl = `${req.protocol}://${req.get('host')}/reset-password-new-get?token=${resetToken}`;
        const emailSubject = 'รีเซ็ตรหัสผ่าน';
        const emailBody = `
            <p>สวัสดี ${user.username},</p>
            <p>กรุณากดลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>
            <a href="${resetPasswordUrl}">รีเซ็ตรหัสผ่าน</a>
            <p>ลิ้งรีเซ็ตรหัสผ่านจะอยู่ได้ 1 วัน</p>
        `;

        await sendEmail(user.googleEmail, emailSubject, emailBody);
        res.json({ success: true, message: 'ส่งอีเมลรีเซ็ตรหัสผ่านสำเร็จ' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด...' });
    }
};


exports.showResetPasswordNew = (req, res) => {
    const token = req.query.token;
    res.render('admin/UserAccountManagement_admin/reset-password-new.ejs', {
        title: 'Reset Password',
        user: req.user,
        token: token,
        layout: "../views/layouts/resetpassUser"
    });
};

exports.resetPasswordNew = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            req.flash('error', 'รหัสผ่านใหม่ไม่ตรงกัน');
            return res.redirect(`/reset-password-new-get?token=${token}`);
        }

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }
        });

        if (!user) {
            console.log('error', 'Token ไม่ถูกต้องหรือหมดอายุ');
            req.flash('error', 'Token ไม่ถูกต้องหรือหมดอายุ');
            return res.redirect('/login');
        }

        // Use the setPassword method with async/await
        await new Promise((resolve, reject) => {
            user.setPassword(newPassword, (err, updatedUser) => {
                if (err) {
                    return reject(err);
                }
                user.resetToken = undefined;
                user.resetTokenExpiration = undefined;
                resolve(updatedUser);
            });
        });

        await user.save(); // Save the user with updated details

        console.log('User saved successfully.');
        req.flash('success', 'รีเซ็ตรหัสผ่านสำเร็จ');
        res.redirect('/login');
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน:', err);
        req.flash('error', 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
        res.redirect('/login');
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


