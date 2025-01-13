/// task controller
const Task = require("../../models/Task");
const Spaces = require('../../models/Space');
const SubTask = require('../../models/SubTask');
const User = require("../../models/User");
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
moment.locale('th');

const extractTaskParameters = async (tasks) => {
    const taskNames = tasks.map(task => task.taskName);
    const taskDetail = tasks.map(task => task.detail);
    const taskStatuses = tasks.map(task => task.taskStatuses);
    const taskTypes = tasks.map(task => task.taskType);
    const taskPriority = tasks.map(task => task.taskPriority);
    const taskTag = tasks.map(task => task.taskTag);

    const dueDate = tasks.map(task => {
        const date = new Date(task.dueDate);
        const options = { day: 'numeric', month: 'long', year: 'numeric', locale: 'th-TH' };
        return date.toLocaleDateString(undefined, options);
    });

    const dueTime = tasks.map(task => task.dueTime); // Extract dueTime from the task

    const createdAt = tasks.map(task => {
        const date = new Date(task.createdAt);
        const options = { day: 'numeric', month: 'long', year: 'numeric', locale: 'th-TH' };
        return date.toLocaleDateString(undefined, options);
    });

    return { taskNames, taskDetail, taskStatuses, taskTypes, dueDate, dueTime, createdAt, taskPriority, taskTag };
};

exports.ItemDetail = async (req, res) => {
    try {
        const taskId = ObjectId(req.params.id);
        const spaceId = ObjectId(req.query.spaceId);

        const task = await Task.findById(taskId)
            .populate('assignedUsers', 'profileImage username')
            .lean();

        const spaces = await Spaces.findById(spaceId).lean();
        const subtasks = await SubTask.find({ task: taskId })
            .populate('assignee', 'profileImage username')
            .sort({ createdAt: -1 })
            .lean();
        const inProgressSubtasks = await SubTask.find({ task: taskId, subTask_status: 'กำลังทำ' })
            .sort({ createdAt: -1 })
            .lean();

        const { taskNames, dueDate, dueTime, taskStatuses, taskDetail, taskPriority, taskTag } =
            await extractTaskParameters([task]);

        const thaiCreatedAt = task.createdAt.toLocaleDateString('th-TH', {
            month: 'long',
            day: 'numeric',
        });

        const formattedSubtasks = subtasks.map(subtask => ({
            ...subtask,
            subTask_dueDate: subtask.subTask_dueDate
                ? subtask.subTask_dueDate.toLocaleDateString('th-TH', {
                    month: 'long',
                    day: 'numeric',
                })
                : 'N/A',
        }));

        const assignedUsers = task.assignedUsers || [];

        res.render("task/task-ItemDetail", {
            user: req.user,
            currentUserId: req.user._id.toString(),
            task,
            attachments: task.attachments || [],
            subtasks: formattedSubtasks,
            inProgressSubtasks,
            tasks: [task],
            taskNames,
            dueDate,
            dueTime: dueTime[0],
            taskDetail,
            taskStatuses,
            createdAt: thaiCreatedAt,
            taskPriority,
            taskTag,
            spaces,
            spaceId,
            assignedUsers,
            userName: req.user.username,
            userImage: req.user.profileImage,
            layout: '../views/layouts/Detail',
            mainTaskDueDate: new Date(dueDate),
        });
    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).send("Internal Server Error");
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { taskId, taskName, taskStatuses, taskPriority, taskDetail } = req.body;
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        let activityLogs = [];

        // Handle task name update
        if (taskName && taskName !== task.taskName) {
            activityLogs.push({
                text: `ชื่อของงานถูกเปลี่ยนเป็น ${taskName} เมื่อ ${new Date().toLocaleString()}`,
                type: 'normal' // You can change this based on your logging needs
            });
            task.taskName = taskName;
        }

        // Handle task detail update
        if (taskDetail && taskDetail !== task.detail) {
            activityLogs.push({
                text: `รายละเอียดของงานถูกอัพเดตเมื่อ ${new Date().toLocaleString()}`,
                type: 'normal'
            });
            task.detail = taskDetail;
        }

        // Handle task status update
        if (taskStatuses) {
            activityLogs.push({
                text: `สถานะของงานถูกเปลี่ยนเป็น ${taskStatuses} เมื่อ ${new Date().toLocaleString()}`,
                type: 'normal'
            });
            task.taskStatuses = taskStatuses; // Update status based on input
        }

        // Handle task priority update
        if (taskPriority && taskPriority !== task.taskPriority) {
            activityLogs.push({
                text: `ความสำคัญของงานถูกเปลี่ยนเป็น ${taskPriority} เมื่อ ${new Date().toLocaleString()}`,
                type: 'normal'
            });
            task.taskPriority = taskPriority;
        }

        // Concatenate new logs to existing activity logs
        task.activityLogs = task.activityLogs.concat(activityLogs);
        await task.save();

        res.status(200).json({ message: 'Task updated successfully', task });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteActivityLog = async (req, res) => {
    try {
        const { taskId, logId } = req.body;

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).send({ message: 'Task not found' });
        }

        task.activityLogs = task.activityLogs.filter(log => log._id.toString() !== logId);

        await task.save();

        res.redirect(`/task/${taskId}/detail`);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId, newStatus } = req.body;
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { status: newStatus },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).send({ message: 'Task not found' });
        }

        res.status(200).send({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.updateTaskPriority = async (req, res) => {
    console.log('Incoming request body:', req.body); // Log request body

    const { taskId, taskPriority } = req.body;

    try {
        const task = await Task.findById(taskId);
        if (!task) {
            console.log('Task not found:', taskId); // Log if task is not found
            return res.status(404).json({ message: 'Task not found' });
        }

        task.taskPriority = taskPriority;
        task.activityLogs.push({
            text: `ความสำคัญของงานถูกเปลี่ยนเป็น ${taskPriority} เมื่อ ${new Date().toLocaleString()}`,
            type: 'normal',
        });

        await task.save();
        console.log('Task priority updated successfully'); // Log success

        res.status(200).json({ success: true, message: 'Task priority updated successfully' });
    } catch (error) {
        console.error('Error in updateTaskPriority:', error); // Log error
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const formatDateTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};
exports.updateDueDate = async (req, res) => {
    const { taskId, dueDate } = req.body; // Removed logMessage from params

    try {
        // Find the task by ID
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Update the task's due date
        task.dueDate = dueDate;

        // Push a new activity log for the due date update
        task.activityLogs.push({
            text: `กำหนดวันเสร็จถูกเปลี่ยนเป็น ${dueDate} เมื่อ ${new Date().toLocaleString()}`,
            type: 'normal' // or 'comment' as needed
        });

        // Save the updated task
        await task.save();

        // Respond with success
        res.status(200).json({ message: 'Due date updated successfully', task }); // Include the updated task
    } catch (error) {
        console.error('Error updating due date:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateDueTime = async (req, res) => {
    const { taskId, dueTime } = req.body;

    try {
        // Find the task by ID
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Update the task's due time
        task.dueTime = dueTime || null; // Store null if "All day" is selected

        // Push a new activity log for the due time update
        task.activityLogs.push({
            text: `เวลาที่กำหนดถูกเปลี่ยนเป็น ${dueTime ? dueTime : 'ทั้งวัน'} เมื่อ ${new Date().toLocaleString()}`,
            type: 'normal' // or 'comment' based on your requirements
        });

        // Save the updated task
        await task.save();

        res.json({ success: true, message: 'Due time updated successfully', task }); // Include the updated task
    } catch (error) {
        console.error('Error updating due time:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        const taskId = req.params.id;
        const spaceId = req.query.spaceId;
        const uploadedFiles = req.files;

        // Store original filename and path (with Thai characters)
        const attachments = uploadedFiles.map(file => ({
            path: `/docUploads/${file.filename}`, // Use relative path for serving files
            originalName: file.originalname // Preserve original name with Thai characters
        }));

        // Update the task with new attachments
        await Task.findByIdAndUpdate(
            taskId,
            { $push: { attachments: { $each: attachments } } },
            { new: true, runValidators: true }
        );

        res.redirect(`/task/${taskId}/detail?spaceId=${spaceId}`);
    } catch (error) {
        console.error('Error uploading documents:', error);
        res.status(500).send('Internal Server Error');
    }
};