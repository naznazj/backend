const Message = require('../models/Message');

// Send a message to admin
exports.sendMessage = async (req, res) => {
    const message = new Message({ content: req.body.content, userId: req.user.id });
    await message.save();
    res.status(201).json(message);
};

// Get messages for a specific user
exports.getUserMessages = async (req, res) => {
    const messages = await Message.find({ userId: req.user.id }).populate('userId', 'email');
    res.json(messages);
};

// Get all messages for admin
exports.getAllMessages = async (req, res) => {
    const messages = await Message.find().populate('userId', 'email');
    res.json(messages);
};
