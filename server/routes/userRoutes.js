const express = require('express');
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const userController = require('../controllers/userController');
const User = require('../models/User'); 
const userActivityLogger = require('../middleware/userActivityLogger');

router.get('/allUsers', isLoggedIn, userActivityLogger, userController.allUsers);
router.post('/addFriend/:id', isLoggedIn, userController.addFriend);
router.post('/deleteFriend/:id', isLoggedIn, userController.deleteFriend);

router.get('/users', async (req, res) => {
    try {
        const users = await User.find(); // Adjust this query based on your User model
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'An error occurred while fetching users.' });
    }
});

module.exports = router;