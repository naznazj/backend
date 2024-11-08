const Facility = require('../models/Facility');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists for images
const imageDir = path.join(__dirname, '../assets/images/facilities');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imageDir); // Save in facilities directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg, .jpeg, and .webp format allowed!'));
        }
    }
}).single('image'); // Ensure this matches the form field name in your request

exports.addFacility = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: 'Image upload failed: ' + err.message });
        }

        try {
            const { name, description, price, availability } = req.body; 
            const imageFile = req.file; 

            if (!name || !description || !price || !availability || !imageFile) {
                return res.status(400).json({ message: 'All fields are required.' });
            }

            const parsedAvailability = typeof availability === 'string' ? JSON.parse(availability) : availability;

            console.log('Parsed Availability:', parsedAvailability); // Debugging log

            const newFacility = new Facility({
                name,
                description,
                price,
                availability: {
                    startDay: parsedAvailability.startDay,
                    endDay: parsedAvailability.endDay,
                    timeRange: {
                        startTime: parsedAvailability.timeRange.startTime,
                        endTime: parsedAvailability.timeRange.endTime
                    }
                },
                imageUrl: `/assets/images/facilities/${imageFile.filename}` 
            });

            await newFacility.save();
            res.status(201).json(newFacility);
        } catch (error) {
            console.error('Error adding facility:', error);
            res.status(500).json({ message: 'Failed to add facility', error: error.message });
        }
    });
};

// Update facility details
exports.updateFacility = async (req, res) => {
    const { id } = req.params;

    try {
        const updatedFacility = await Facility.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedFacility) {
            return res.status(404).json({ message: 'Facility not found' });
        }
        res.json(updatedFacility);
    } catch (error) {
        res.status(500).json({ error: 'Error updating facility: ' + error.message });
    }
};

// Delete a facility
exports.deleteFacility = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedFacility = await Facility.findByIdAndDelete(id);
        if (!deletedFacility) {
            return res.status(404).json({ message: 'Facility not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting facility: ' + error.message });
    }
};

// Get all facilities (including their images)
exports.getAllFacilities = async (req, res) => {
    try {
        const facilities = await Facility.find(); // Fetch all facilities from your database
        const facilitiesWithImageUrl = facilities.map(facility => ({
            ...facility.toObject(),
            imageUrl: facility.imageUrl // This retrieves the full URL
        }));
        res.json(facilitiesWithImageUrl);
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get available facilities
exports.getAvailableFacilities = async (req, res) => {
    try {
        const facilities = await Facility.find({ availability: { $exists: true } }); // Adjust query as needed
        res.json(facilities);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching available facilities: ' + error.message });
    }
};

exports.getFacilityById = async (req, res) => {
    const { id } = req.params; // Extract ID from the request parameters
    console.log('Fetching facility with ID:', id); // Debugging log

    try {
        const facility = await Facility.findById(id); // Fetch the facility by ID
        if (!facility) {
            console.log('Facility not found'); // Debugging log
            return res.status(404).json({ message: 'Facility not found' });
        }
        res.json(facility); // Send the facility data back to the client
    } catch (error) {
        console.error('Error fetching facility:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
