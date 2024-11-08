const User = require('../models/User');
const Facility = require('../models/Facility');
const Reservation = require('../models/Reservation');
const Message = require('../models/Message');

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Manage facilities - Get all facilities
exports.getFacilities = async (req, res) => {
    try {
        const facilities = await Facility.find();
        res.json(facilities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new facility
exports.addFacility = async (req, res) => {
    const { name } = req.body;
    const newFacility = new Facility({ name });
    await newFacility.save();
    res.status(201).json(newFacility);
};

// Update a facility
exports.updateFacility = async (req, res) => {
    const { id } = req.params;
    const { name, availability } = req.body;

    const updatedFacility = await Facility.findByIdAndUpdate(id, { name, availability }, { new: true });
    res.json(updatedFacility);
};

// Delete a facility
exports.deleteFacility = async (req, res) => {
    const { id } = req.params;
    await Facility.findByIdAndDelete(id);
    res.status(204).send();
};

// Get messages sent to admin
exports.getMessages = async (req, res) => {
    const messages = await Message.find().populate('userId', 'email');
    res.json(messages);
};
