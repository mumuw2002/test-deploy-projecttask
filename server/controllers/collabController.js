//Collaboration Controller
const Spaces = require('../models/Space');
const User = require("../models/User");
const Notification = require('../models/Noti');
const notiController = require('../controllers/notiController');
const moment = require('moment');

exports.manage_Member = async (req, res) => {
    try {
        const space = await Spaces.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user._id },
                { collaborators: { $elemMatch: { user: req.user._id } } } 
            ]
        })
            .populate('user', 'username profileImage') 
            .populate('collaborators.user', 'username profileImage email googleEmail lastActive') 
            .lean();

        if (!space) {
            return res.status(404).send("Space not found");
        }

        const currentUserRole = space.collaborators.find(
            collab => collab.user._id.toString() === req.user._id.toString()
        )?.role || 'Member';

        const validCollaborators = space.collaborators.filter(collab => collab && collab.user);

        const collaboratorIds = validCollaborators.map(collab => collab.user._id.toString());
        collaboratorIds.push(space.user._id.toString());

        const allUsers = await User.find(
            { _id: { $nin: collaboratorIds } },
            'username profileImage googleEmail'
        ).lean();

        const pendingInvitations = await Notification.find({ space: req.params.id, status: 'pending' })
            .populate('user', 'username profileImage googleEmail') 
            .lean();

        res.render("task/task-member", {
            spaces: space,
            spaceId: req.params.id,
            collaborators: validCollaborators,
            owner: space.user,
            allUsers,
            user: req.user,
            userImage: req.user.profileImage,
            userName: req.user.username,
            currentPage: 'task_member',
            currentUserRole,
            pendingInvitations,
            layout: "../views/layouts/task",
            moment // Add moment to the render context
        });

    } catch (error) {
        console.error('Error loading task member page:', error);
        res.status(500).send("Internal Server Error");
    }
};

exports.addMemberToSpace = async (req, res) => {
    try {
        const { memberId, role, spaceId } = req.body;

        const space = await Spaces.findById(spaceId);
        if (!space) return res.status(404).json({ 
            success: false,
            message: 'Space not found'
        });

        // Check if the user is already a member
        const isMember = space.collaborators.some(collab => collab.user.toString() === memberId);
        if (isMember) {
            return res.status(400).json({ 
                success: false,
                message: 'User is already a member of this space'
            });
        }

        // Check if the user has a pending invitation
        const hasPendingInvitation = await Notification.findOne({ 
            user: memberId, 
            space: spaceId, 
            status: 'pending' 
        });
        if (hasPendingInvitation) {
            return res.status(400).json({ 
                success: false,
                message: 'User already has a pending invitation'
            });
        }

        // Create a pending invitation
        const notification = new Notification({
            user: memberId,
            space: spaceId,
            role,
            status: 'pending',
            type: 'invitation',
            leader: req.user._id
        });
        await notification.save();

        res.status(200).json({ success: true, message: 'Invitation sent successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.searchMembers = async (req, res) => {
    try {
        const query = req.query.q;
        const spaceId = req.query.spaceId;

        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        // Find the space to get the list of current members and pending invitations
        const space = await Spaces.findById(spaceId).lean();
        if (!space) {
            return res.status(404).json({ message: 'Space not found' });
        }

        const collaboratorIds = space.collaborators.map(collab => collab.user.toString());
        const pendingInvitations = await Notification.find({ space: spaceId, status: 'pending' }).lean();
        const pendingInvitationIds = pendingInvitations.map(invite => invite.user.toString());

        const excludedIds = [...collaboratorIds, ...pendingInvitationIds];

        const users = await User.find(
            {
                _id: { $nin: excludedIds },
                $or: [
                    { username: { $regex: query, $options: 'i' } },
                    { userid: { $regex: query, $options: 'i' } },
                    { googleEmail: { $regex: query, $options: 'i' } },
                ],
            },
            'username userid googleEmail profileImage role'
        ).lean();

        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching search results:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateRole = async (req, res) => {
    const { memberId } = req.params;
    const { role, spaceId } = req.body; 

    try {
        const space = await Spaces.findOne({
            _id: spaceId,
            collaborators: { $elemMatch: { user: req.user._id, role: 'Leader' } }
        });

        if (!space) {
            return res.status(403).json({ success: false, message: 'Unauthorized to change role.' });
        }

        const member = space.collaborators.find(collab => collab.user.toString() === memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        await Spaces.updateOne(
            { _id: spaceId, 'collaborators.user': memberId },
            { $set: { 'collaborators.$.role': role } }
        );

        // Create a notification for the user whose role has been changed
        const notification = new Notification({
            user: memberId,
            space: spaceId,
            role,
            status: 'accepted', // Directly set to accepted since it's a role change notification
            type: 'roleChange',
            leader: req.user._id // Include the leader's information
        });
        await notification.save();

        res.json({ success: true, message: 'Role updated successfully and notification sent.' });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.deleteMember = async (req, res) => {
    const { memberId } = req.params;
    const { spaceId } = req.body;

    try {
        const space = await Spaces.findOne({
            _id: spaceId,
            collaborators: { $elemMatch: { user: req.user._id, role: 'Leader' } }
        });

        if (!space) {
            return res.status(403).json({ success: false, message: 'Unauthorized to remove member.' });
        }

        const memberIndex = space.collaborators.findIndex(collab => collab.user.toString() === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        const removedMember = space.collaborators.splice(memberIndex, 1)[0];
        await space.save();

        // Create a notification for the user who has been removed
        const notification = new Notification({
            user: memberId,
            space: spaceId,
            role: removedMember.role,
            status: 'accepted', // Directly set to accepted since it's a removal notification
            type: 'removal',
            leader: req.user._id // Include the leader's information
        });
        await notification.save();

        res.json({ success: true, message: 'Member removed successfully and notification sent.' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.respondToInvitation = async (req, res) => {
    const { notificationId, response } = req.body;
    console.log('Received response:', response); 
    console.log('Notification ID:', notificationId); 

    try {
        const notification = await Notification.findById(notificationId)
                                             .populate('space user') 
                                             .lean(); // Add .lean() here

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (response === 'accepted') {
            //  Update the Space model directly
            await Spaces.findByIdAndUpdate(notification.space._id, {
                $push: {
                    collaborators: {
                        user: notification.user._id,
                        role: notification.role 
                    }
                }
            });
        }

        // Update the Notification status
        await Notification.findByIdAndUpdate(notificationId, { status: response });

        res.json({ message: `Invitation ${response}` });
    } catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({ message: 'Error responding to invitation' });
    }
};