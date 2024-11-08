const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true }, // Reference to the User model
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true }, // Reference to the Facility model
    facilityName: { type: String, required: true },
    price: { type: Number, required: true },
    address: { type: String, required: true },
    contactNumber: { type: String, required: true },
    reservationDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    purpose: { type: String, required: true },
    status: { type: String, default: 'Pending' },
}, { timestamps: true });

reservationSchema.index({ reservationDate: 1, facilityId: 1, startTime: 1, endTime: 1 }, { unique: true });

module.exports = mongoose.model('Reservation', reservationSchema);
