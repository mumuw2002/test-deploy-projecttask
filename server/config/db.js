// C:\Users\plamy\OneDrive\เดสก์ท็อป\Task_Project\server\config\db.js
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const connectDB = async() => {
  console.log('Connected to MongoDB')
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.log(error);
  }
}

module.exports = connectDB;