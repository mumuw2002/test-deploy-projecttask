const Subject = require("../models/Subject");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.allUsers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends').exec();
        const friendIds = user.friends.map(friend => friend._id);
        const users = await User.find({ _id: { $ne: req.user._id, $nin: friendIds } }).exec();
        res.render("user/allUsers", {
            users: users,
            layout: "../views/layouts/main",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

exports.addFriend = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.friends.includes(req.params.id)) {
            user.friends.push(req.params.id);
            await user.save();
        }
        res.redirect('/friend');
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

exports.deleteFriend = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.friends = user.friends.filter(friendId => friendId.toString() !== req.params.id);
        await user.save();
        res.redirect('/friend');
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};