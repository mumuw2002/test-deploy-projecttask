// C:\Users\plamy\OneDrive\เดสก์ท็อป\Task_Project\emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        });
        console.log(`อีเมลส่งสำเร็จไปยัง ${to}`);
        return true;
    } catch (error) {
        console.error(`เกิดข้อผิดพลาดในการส่งอีเมลไปยัง ${to}:`, error);
        return false;
    }
};
