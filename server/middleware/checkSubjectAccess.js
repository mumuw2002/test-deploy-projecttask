// check subject access middleware
const Subject = require('../models/Subject');

const checkSubjectAccess = async (req, res, next) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject || (!subject.user.equals(req.user._id) && !subject.collaborators.includes(req.user._id))) {
            return res.status(404).send("Subject not found"); // Use 404 for subject not found instead of 403
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = checkSubjectAccess;