const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subjectSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    SubName: {
        type: String,
        required: true
    },
    SubDescription: {
        type: String
    },
    SubjectCode: {
        type: String
    },
    Professor: {
        type: String
    },
    SubPicture: {
        type: String
    },
    deleted: {
        type: Boolean,
        default: false
    },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true  // Automatically adds createdAt and updatedAt fields
});

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;