//server\models\User.js
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    userid: {
        type: String,
        unique: true,
        default: function () {
            const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
            return '#' + Array.from({ length: 5 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
        }
    },
    username: {
        type: String,
        required: true,
        default: 'anonymous',
    },
    password: {
        type: String,
        required: false,
        minlength: [8, "รหัสผ่านต้องมีอักขระอย่างน้อย 8 ตัว"],
    },
    googleId: {
        type: String,
        required: false,
    },
    googleEmail: {
        type: String,
        required: false,
        unique: true,
    },
    profileImage: {
        type: String,
        default: '/img/profileImage/Profile.jpeg',
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin'],
    },
    otp: {
        type: String,
        required: false,
    },
    otpExpires: {
        type: Date,
        required: false,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            inWeb: { type: Boolean, default: true },
        },
    },
    resetToken: {
        type: String,
        required: false,
    },
    resetTokenExpiration: {
        type: Date,
        required: false,
    },    
});

UserSchema.plugin(passportLocalMongoose, { usernameField: 'googleEmail' });

module.exports = mongoose.model('User', UserSchema);
