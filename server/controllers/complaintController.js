//complaintController.js
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { sendEmail } = require('../../emailService');

function generateComplaintNumber(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  // หา complaint ล่าสุดของวันนี้
  return Complaint.findOne({ submittedAt: { $gte: new Date(year, month - 1, day) } })
    .sort({ submittedAt: -1 })
    .then(lastComplaint => {
      let sequenceNumber = 1;
      if (lastComplaint && lastComplaint.complaintNumber) { // เพิ่มเงื่อนไขตรวจสอบ lastComplaint.complaintNumber
        const lastComplaintNumber = lastComplaint.complaintNumber;
        const lastSequenceNumber = parseInt(lastComplaintNumber.split('-')[2], 10);
        sequenceNumber = lastSequenceNumber + 1;
      }
      const formattedSequenceNumber = sequenceNumber.toString().padStart(4, '0');
      return `COMPLAINT-${year}${month}${day}-${formattedSequenceNumber}`;
    });
}

exports.ComplaintPage = (req, res, next) => {
  res.render('task/task-complaint', {
    title: 'Complaint Page',
    user: req.user,
    layout: '../views/layouts/complaint'
  });
};

exports.submitComplaint = async (req, res, next) => {
  try {
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    // เพิ่มการตรวจสอบ path upload
    const newScreenshots = req.files.map(file => {
      const uploadPath = '/img/screenshotsuploads/screenshots/' + path.basename(file.path);
      console.log('Upload Path:', uploadPath); // ตรวจสอบ path upload
      return uploadPath;
    });

    console.log('Saved Files:', req.files); // ตรวจสอบ req.files
    console.log('New Screenshots:', newScreenshots); // ตรวจสอบ screenshots ที่สร้างใหม่

    const complaintNumber = await generateComplaintNumber(new Date()); // สร้างหมายเลขร้องเรียน

    const complaintData = {
      userId: req.user._id,
      category: req.body.category,
      complaintContent: req.body.complaintContent,
      screenshots: newScreenshots,
      complaintNumber: complaintNumber,
      additionalInfo: req.body.additional_info,
    };

    const complaint = new Complaint(complaintData);
    await complaint.save();

    // ส่งอีเมลแจ้งผู้ใช้ว่าได้สร้างรายงานปัญหาแล้ว
    const user = req.user;
    const emailSubject = 'รายงานปัญหาของคุณได้รับการบันทึกแล้ว';
    const emailBody = `
      <p>สวัสดี ${user.username},</p>
      <p>รายงานปัญหาของคุณได้รับการบันทึกแล้ว หมายเลขร้องเรียน: ${complaint.complaintNumber}</p>
      <p>เราจะดำเนินการตรวจสอบและแก้ไขปัญหาโดยเร็วที่สุด</p>
    `;
    await sendEmail(user.googleEmail, emailSubject, emailBody);

    console.log('Complaint saved successfully');
    res.redirect('/complaint/statuscomplaint');
  } catch (err) {
    console.error('Error during complaint submission:', err);
    res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
  }
};

exports.statusComplaint = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ status: { $ne: 'Closed' } }) // ดึงเฉพาะ complaint ที่ไม่ได้ Closed
      .populate('userId')
      .sort({ submittedAt: -1 });
    res.render('task/task-complaint/task-updatecomplaint', {
      title: 'Complaint Page',
      user: req.user,
      complaints: complaints, // ส่ง complaints ไปยัง template
      layout: '../views/layouts/complaint'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
};

exports.complaintDetail = async (req, res, next) => {
  try {
    const complaintId = req.params.id;
    const complaint = await Complaint.findById(complaintId).populate('userId');
    if (!complaint) {
      return res.status(404).send('ไม่พบรายงานปัญหา');
    }
    res.render('task/task-complaint/task-complaint-detail', {
      title: 'รายละเอียดรายงานปัญหา',
      user: req.user,
      complaint: complaint,
      layout: '../views/layouts/complaint'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
};

exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const complaintId = req.params.id;
    const newStatus = req.body.status;

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { status: newStatus, resolvedAt: new Date() },
      { new: true }
    );

    if (!updatedComplaint) {
      return res.status(404).send('ไม่พบรายงานปัญหา');
    }

    const complaint = updatedComplaint;
    const user = await User.findById(complaint.userId); // ดึงข้อมูล user
    const emailSubject = `อัพเดตสถานะรายงานปัญหา: ${complaint.complaintNumber}`;
    const emailBody = `
      <p>สวัสดี ${user.username},</p>
      <p>สถานะรายงานปัญหาของคุณ (หมายเลข: ${complaint.complaintNumber}) ได้รับการอัพเดตเป็น "${complaint.status}" แล้ว</p>
    `;

    await sendEmail(user.googleEmail, emailSubject, emailBody);

    res.redirect('/ReportUserProblem');
  } catch (err) {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาดในการอัพเดตสถานะ');
  }
};

exports.endStatusComplaint = async (req, res, next) => { 
  try {
    const complaints = await Complaint.find({ status: 'Closed' }) // ดึงเฉพาะ complaint ที่ Closed แล้ว
      .populate('userId')
      .sort({ submittedAt: -1 });
    res.render('task/task-complaint/task-endupdatecomplaint', {
      title: 'Complaint Page',
      user: req.user,
      complaints: complaints, // ส่ง complaints ไปยัง template
      layout: '../views/layouts/complaint'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
};