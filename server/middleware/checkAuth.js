// check auth middleware
const Subject = require('../models/Subject'); // Adjust the path as needed
const User = require('../models/User');

exports.isLoggedIn = async function (req, res, next) {
    if (req.isAuthenticated()) {
        if (req.originalUrl.startsWith('/subject')) {
            const subjectId = req.params.id || req.body.subjectId;
            if (subjectId) {
                try {
                    const subject = await Subject.findById(subjectId);
                    if (!subject || 
                        (!subject.user.equals(req.user._id) && 
                         !subject.collaborators.includes(req.user._id))) {
                        return res.status(404).send("Subject not found"); // Use 404 for not found
                    }
                } catch (error) {
                    console.log(error);
                    return res.status(500).send("Internal Server Error");
                }
            }
        }
        return next();
    } else {
        res.redirect('/login');
    }
};