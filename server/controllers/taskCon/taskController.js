/// task controller
const Task = require("../../models/Task");
const Spaces = require('../../models/Space');
const SubTask = require('../../models/SubTask');
const User = require("../../models/User");
const moment = require('moment');
const fs = require('fs');
const path = require('path');
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

/// Add Task
exports.addTask = async (req, res) => {
  try {
    const assignedUsers = req.body.assignedUsers || [];
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;

    const newTask = new Task({
      taskName: req.body.taskName,
      dueDate: dueDate,
      taskTag: req.body.taskTag,
      detail: req.body.detail,
      taskType: req.body.taskType,
      user: req.user.id,
      space: req.body.spaceId, // Change subjectId to spaceId
      assignedUsers: assignedUsers
    });

    await newTask.save();
    res.redirect(`/space/item/${req.body.spaceId}`); // Change URL accordingly
    console.log(newTask);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addTask_list = async (req, res) => {
  try {
    const newTask = new Task({
      taskName: req.body.taskName,
      taskTag: req.body.taskTag,
      detail: req.body.detail,
      user: req.user.id,
      space: req.body.spaceId,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null, // Handle due date
      dueTime: req.body.dueTime || null // Set due time to null if not provided
    });

    await newTask.save();

    console.log(newTask); // Log the newly created task
    res.redirect(`/space/item/${req.body.spaceId}/task_list`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

/// popup เพิ่มงาน จากหน้า list
exports.addTask2 = async (req, res) => {
  try {
    const { dueDate, taskName, taskTag, detail, taskType, spaceId } = req.body;
    const assignedUsers = req.body.assignedUsers || [];
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

    const newTask = new Task({
      taskName: taskName,
      dueDate: parsedDueDate,
      taskTag: taskTag,
      detail: detail,
      taskType: taskType,
      user: req.user.id,
      space: spaceId,
      assignedUsers: assignedUsers
    });

    await newTask.save();

    res.redirect(`/space/item/${spaceId}/task_list`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addTask_board = async (req, res) => {
  try {
    const { dueDate, taskName, detail, spaceId, assignedUsers } = req.body;
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

    const newTask = new Task({
      taskName: taskName,
      dueDate: parsedDueDate,
      detail: detail,
      user: req.user.id,
      space: spaceId,
      assignedUsers: Array.isArray(assignedUsers) ? assignedUsers : [assignedUsers] // Ensure it's an array
    });

    await newTask.save();

    res.redirect(`/space/item/${spaceId}/task_board`);
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getSubtaskCount = async (req, res) => {
  try {
    let taskIds = req.body.taskIds;
    taskIds = taskIds.split(',').filter(id => id); // Ensure valid IDs

    // Count the subtasks related to the tasks
    const subtaskCount = await SubTask.countDocuments({ task: { $in: taskIds } });

    res.status(200).json({ subtaskCount });
  } catch (error) {
    console.error('Error fetching subtask count:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.deleteTasks = async (req, res) => {
  try {
    let taskIds = req.body.taskIds;
    taskIds = taskIds.split(',').filter(id => id); // Ensure valid IDs

    const spaceId = req.params.id;
    const space = await Spaces.findOne({ _id: spaceId, user: req.user.id });

    if (!space) {
      return res.status(404).send('Space not found or unauthorized');
    }

    // Count the number of subtasks associated with the tasks
    const subtaskCount = await SubTask.countDocuments({ task: { $in: taskIds } });

    // Delete all subtasks related to the tasks
    await SubTask.deleteMany({ task: { $in: taskIds } });

    // Delete the main tasks
    await Task.deleteMany({ _id: { $in: taskIds }, space: spaceId });

    res.status(200).json({
      message: 'Tasks and subtasks deleted successfully',
      subtaskCount
    });
  } catch (error) {
    console.error('Error deleting tasks:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.pendingTask = async (req, res) => {
  try {
    const space = await Spaces.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { collaborators: { $elemMatch: { user: req.user._id, role: 'Leader' } } }]
    }).lean();

    if (!space) {
      return res.status(404).send("Space not found");
    }

    const tasks = await Task.find({
      space: req.params.id,
      taskStatuses: 'รอตรวจ' // Filter tasks with 'Pending' status
    })
      .populate({
        path: 'assignedUsers',
        select: 'displayName profileImage'
      })
      .lean();

    // Get the user's role from the collaborators array
    const currentUserRole = space.collaborators.find(collab => collab.user.toString() === req.user._id.toString())?.role || 'Member';
    res.render("task/pending-task", {
      tasks,
      spaces: space,
      spaceId: req.params.id,
      user: req.user,
      userName: req.user.firstName,
      userImage: req.user.profileImage,
      currentPage: 'pending-task',
      layout: "../views/layouts/task",
      currentUserRole,
    });
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    res.status(500).send("Internal Server Error");
  }
};

exports.pendingDetail = async (req, res) => {
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

    res.render("task/detail-pending-task", {
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

// Controller function to delete a file
exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    // Find the task that contains the file attachment by its ID
    const task = await Task.findOne({ 'attachments._id': fileId });

    if (!task) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Find the specific file in the attachments array and remove it
    const file = task.attachments.id(fileId);
    const filePath = file.path; // Get the path to the file

    file.remove(); // Remove the file from the task's attachments
    await task.save(); // Save the updated task

    // Optionally delete the file from the filesystem
    fs.unlink(path.join(__dirname, '..', filePath), (err) => {
      if (err) {
        console.error('Error deleting file from filesystem:', err);
      }
    });

    // Send a success response
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body; // Get the comment from the request
    const taskId = req.params.id; // Assume taskId is passed in the URL

    // Push the comment as an object to the activityLogs
    await Task.findByIdAndUpdate(taskId, {
      $push: {
        activityLogs: { text: comment, type: 'comment' }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.updateTaskDescription = async (req, res) => {
  const { taskId, taskDetail } = req.body; // Ensure 'taskDetail' matches field in frontend

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Update the task description
    task.detail = taskDetail;  // Use 'detail' to align with schema field

    // Add to activity logs
    task.activityLogs.push({
      text: `คำอธิบายของงานถูกอัปเดตเมื่อ ${new Date().toLocaleString()}`,
      type: 'normal',
    });

    await task.save();  // Save the updated task

    res.status(200).json({ success: true, message: 'Task description updated successfully' });
  } catch (error) {
    console.error('Error updating task description:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

