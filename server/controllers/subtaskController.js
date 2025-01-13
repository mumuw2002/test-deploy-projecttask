// subtask controller
const SubTask = require("../models/SubTask");

exports.createSubTask = async (req, res) => {
    const { taskId, subTask, dueDate, assignee } = req.body;

    console.log("Received data:", { taskId, subTask, dueDate, assignee });

    try {
        if (!taskId || !subTask || !dueDate || !assignee) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Assuming req.user._id contains the ID of the user creating the subtask
        const creatorId = req.user._id;

        const newSubTask = new SubTask({
            task: taskId,
            subtask_Name: subTask,
            subTask_dueDate: dueDate ? new Date(dueDate) : null,
            assignee,
            creator: creatorId,
        });

        await newSubTask.save();
        res.status(200).json({ message: 'Subtask created successfully' });
    } catch (error) {
        console.error('Error creating subtask:', error);
        res.status(500).json({ message: 'Error creating subtask' });
    }
};

exports.deleteSubtask = async (req, res) => {
    try {
        const subtaskId = req.params.id;
        await SubTask.findByIdAndDelete(subtaskId);
        res.status(200).json({ message: 'Subtask deleted successfully.' });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({ message: 'Failed to delete subtask.' });
    }
};

exports.toggleSubTaskStatus = async (req, res) => {
    const { subtaskId } = req.body;
    const userId = req.user._id;

    if (!subtaskId) {
        return res.status(400).json({ message: 'Subtask ID is required' });
    }

    try {
        const subtask = await SubTask.findById(subtaskId).populate('assignee');

        if (!subtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }

        const isOwner = String(subtask.creator) === String(userId);
        const isAssignee = subtask.assignee && String(subtask.assignee._id) === String(userId);

        if (!isAssignee) {
            return res.status(403).json({ message: 'You are not authorized to update this subtask status' });
        }

        // Toggle the status
        subtask.subTask_status = subtask.subTask_status === 'กำลังทำ' ? 'เสร็จสิ้น' : 'กำลังทำ';
        await subtask.save();

        res.status(200).json({
            message: 'Status updated successfully',
            status: subtask.subTask_status,
        });
    } catch (error) {
        console.error('Error toggling status:', error);
        res.status(500).json({ message: 'Error updating status' });
    }
};

exports.getSubtaskDetails = async (req, res) => {
    try {
        const subtask = await SubTask.findById(req.params.id);

        if (!subtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }

        res.status(200).json(subtask);
    } catch (error) {
        console.error('Error fetching subtask details:', error);
        res.status(500).json({ message: 'Failed to fetch subtask details' });
    }
};

exports.updateSubtask = async (req, res) => {
    try {
        const { subtaskId, SubtaskName, subtaskDescription } = req.body;
        const newStatus = req.body.subtaskStatus; // Get the new status

        // Update the subtask in the database
        const updatedSubtask = await SubTask.findByIdAndUpdate(
            subtaskId,
            {
                subtask_Name: SubtaskName, // Update the name if needed
                description: subtaskDescription, // Update description
                subTask_status: newStatus // Update status
            },
            { new: true } // Return the updated subtask
        );

        if (!updatedSubtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }

        // Respond with success
        res.status(200).json({ message: 'Subtask updated successfully', subtask: updatedSubtask });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateSubtaskDescription = async (req, res) => {
    const { id, detail } = req.body;
    try {
        const subtask = await SubTask.findByIdAndUpdate(id, { detail }, { new: true });
        if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

        res.status(200).json({ success: true, message: 'Subtask description updated', subtask });
    } catch (error) {
        console.error('Error updating subtask description:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
