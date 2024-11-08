const mongoose = require('mongoose');

// Create an array of times with 1-hour gaps
const timeOptions = [];
for (let hour = 0; hour < 24; hour++) {
    const time = new Date(0, 0, 0, hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timeOptions.push(time);
}

const facilitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true }, 
    imageUrl: { type: String, required: true },
    availability: {
        startDay: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], // Start day of availability
            required: true,
        },
        endDay: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], // End day of availability
            required: true,
        },
        timeRange: {
            startTime: { type: String, required: true }, // No enum, just required string
            endTime: { type: String, required: true } // No enum, just required string
        }
    },
    createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Facility', facilitySchema);
