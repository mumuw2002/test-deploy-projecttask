// sub Task Models
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subTaskSchema = new Schema({
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    subtask_Name: {
        type: String,
        required: true
    },
    subTask_dueDate: {
        type: Date
    },
    assignee: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    creator: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    subTask_status: {
        type: String,
        enum: ['กำลังทำ', 'เสร็จสิ้น'],
        default: 'กำลังทำ'
    },
    activityLogs: {
        type: [String],
        default: []
    }
}, { timestamps: { createdAt: 'createdAt' } });

const SubTask = mongoose.model('SubTask', subTaskSchema);
module.exports = SubTask;