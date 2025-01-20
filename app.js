// app.js
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const connectDB = require('./server/config/db');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const path = require('path');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./server/models/User');
const moment = require('moment');
const bodyParser = require('body-parser');
const schedule = require('node-schedule'); // เพิ่มการใช้งาน node-schedule
const SystemAnnouncement = require('./server/models/SystemAnnouncements'); // เพิ่มโมเดล SystemAnnouncements
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 5001;

// Middleware สำหรับ parse body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to Database
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD; // ดึงรหัสผ่านจาก .env

// สร้าง Admin เมื่อเซิร์ฟเวอร์เริ่มทำงาน
const createAdminUser = async () => {
  try {
      const existingAdmin = await User.findOne({ googleEmail: adminEmail });

      if (!existingAdmin) {
          const newAdmin = new User({
              googleEmail: adminEmail,
              username: 'Administrator',
              role: 'admin',
          });

          // Hash adminPassword ก่อนบันทึก
          const saltRounds = 10; 
          const hashedPassword = await bcrypt.hash(adminPassword, saltRounds); 

          await User.register(newAdmin, hashedPassword); 
      } 
  } catch (err) {
      console.error('Failed to create admin user:', err);
  }
};

createAdminUser();

// ตั้งค่าการลบประกาศที่หมดอายุทุกวันเวลาเที่ยงคืน
schedule.scheduleJob('0 0 * * *', async () => {
  try {
    const now = new Date();
    const result = await SystemAnnouncement.updateMany(
      { expirationDate: { $lt: now }, isDeleted: { $ne: true } },
      { isDeleted: true, updatedAt: now }
    );
    console.log(`${result.nModified} ประกาศที่หมดอายุถูกย้ายไปที่ history เรียบร้อยแล้ว`);
  } catch (error) {
    console.error('Error moving expired announcements to history:', error);
  }
});


// เรียกใช้งานฟังก์ชันหลังเชื่อมต่อฐานข้อมูล
connectDB()
  .then(() => {
    console.log('Connected to database');
    createAdminUser(); // เรียกฟังก์ชันสร้าง Admin
  })
  .catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });

passport.use(User.createStrategy());


// Passport configuration
passport.use(
  new LocalStrategy(
    {
      usernameField: 'googleEmail', // ใช้ googleEmail เป็น usernameField
      passwordField: 'password', // ใช้ password เป็น passwordField
    },
    User.authenticate()
  )
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), 
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON requests
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/docUploads', express.static(path.join(__dirname, 'docUploads')));
app.use(methodOverride('_method'));

// Flash middleware setup
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Middleware to handle due date validation and formatting
app.use((req, res, next) => {
  if (req.body.dueDate) {
    const dueDate = moment(req.body.dueDate, moment.ISO_8601, true); // Parsing ISO 8601 dates
    if (!dueDate.isValid()) {
      console.error('Invalid date format:', req.body.dueDate);
      req.flash('error', 'Invalid date format');
      return res.redirect('back');
    }
    req.body.dueDate = dueDate.toISOString(); // Standardize to ISO format for storage
  }
  next();
});

// Middleware to update lastActive on each request
app.use(async (req, res, next) => {
  if (req.isAuthenticated()) {
    try {
      req.user.lastActive = Date.now();
      await req.user.save();
    } catch (error) {
      console.error('Error updating lastActive:', error);
    }
  }
  next();
});


// Templating Engine setup
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes setup
app.use('/', require('./server/routes/auth'));
app.use('/', require('./server/routes/index'));
app.use('/', require('./server/routes/spaceRoutes'));
app.use('/', require('./server/routes/taskRou/taskPageRoutes'));
app.use('/', require('./server/routes/taskRou/taskDetailRoutes'));
app.use('/', require('./server/routes/taskRou/taskComplaintRouter'));
app.use('/', require('./server/routes/notiRoutes'));
app.use('/', require('./server/routes/subtaskRoutes')); 
app.use('/', require('./server/routes/settingRoutes'));
app.use('/', require('./server/routes/userRoutes'));
app.use('/', require('./server/routes/adminRoutes'));
app.use('/', require('./server/routes/collabRoutes'));


// Handle 404 errors
app.get('*', (req, res) => {
  res.status(404).render('404');
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
