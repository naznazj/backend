const Facility = require('../models/Facility');
const Reservation = require('../models/Reservation');
const user = require('../models/User')


// Create reservation function
exports.createReservation = async (req, res) => {
    try {
        const { facilityId, address, reservationDate, startTime, endTime, contactNumber, purpose } = req.body;
        const userId = req.user.id; // Fetch the userId from the authenticated user

        // Fetch facility details
        const facility = await Facility.findById(facilityId);
        if (!facility) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        // Create fullName using req.user
        const fullName = `${req.user.firstName} ${req.user.lastName}`; // Corrected line

        // Get the day of the week for the reservation date
        const reservationDateObj = new Date(reservationDate);
        const reservationDay = reservationDateObj.toLocaleDateString('en-US', { weekday: 'long' });

        // Create an array of available days
        const availableDays = [];
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const startIndex = days.indexOf(facility.availability.startDay);
        const endIndex = days.indexOf(facility.availability.endDay);

        // Handle cases where the start and end days may wrap around
        if (startIndex <= endIndex) {
            for (let i = startIndex; i <= endIndex; i++) {
                availableDays.push(days[i]);
            }
        } else {
            for (let i = startIndex; i < days.length; i++) {
                availableDays.push(days[i]);
            }
            for (let i = 0; i <= endIndex; i++) {
                availableDays.push(days[i]);
            }
        }

        // Check if the reservation day is in the available days
        if (!availableDays.includes(reservationDay)) {
            return res.status(400).json({ message: 'Facility is not available on this day' });
        }

        // Validate requested times against facility's available time range
        const { startTime: availableStartTime, endTime: availableEndTime } = facility.availability.timeRange;
        const facilityStartTime = new Date(`1970-01-01T${availableStartTime}:00`).getTime();
        const facilityEndTime = new Date(`1970-01-01T${availableEndTime}:00`).getTime();

        // Convert requested times to milliseconds
        const requestedStartTime = new Date(`1970-01-01T${startTime}:00`).getTime();
        const requestedEndTime = new Date(`1970-01-01T${endTime}:00`).getTime();

        // Check if the requested time is within the facility's available time range
        if (requestedStartTime < facilityStartTime || requestedEndTime > facilityEndTime) {
            return res.status(400).json({ message: 'Reservation time is outside the facility\'s available time range' });
        }

        // Format requested reservation times (24-hour format)
        const formattedStartTime = new Date(`${reservationDate}T${startTime.padStart(5, '0')}:00`).getTime();
        const formattedEndTime = new Date(`${reservationDate}T${endTime.padStart(5, '0')}:00`).getTime();
        
        if (formattedStartTime >= formattedEndTime) {
            return res.status(400).json({ message: 'End time must be later than start time.' });
        }

        const conflictingReservations = await Reservation.find({
            facilityId,
            reservationDate: reservationDateObj,
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
                { startTime: { $lt: formattedEndTime }, endTime: { $gt: formattedStartTime } },
                { startTime: { $gte: formattedStartTime }, endTime: { $lte: formattedEndTime } },
                { startTime: { $lte: formattedStartTime }, endTime: { $gte: formattedEndTime } }
            ]
        });

        if (conflictingReservations.length > 0) {
            return res.status(400).json({ message: 'Time conflict detected.' });
        }

        // Check for duplicate reservation
        const duplicateReservation = await Reservation.findOne({
            facilityId,
            reservationDate: reservationDateObj,
            startTime: formattedStartTime,
            endTime: formattedEndTime
        });

        if (duplicateReservation) {
            return res.status(400).json({ message: 'Duplicate reservation detected.' });
        }

        // Create new reservation if all checks pass
        const newReservation = new Reservation({
            userId,
            fullName,
            facilityId,
            facilityName: facility.name,
            price: facility.price,
            address,
            contactNumber,
            reservationDate: reservationDateObj, // Store as Date object
            startTime,
            endTime,
            purpose,
            status: 'Pending' // Default status
        });

        // Save to the database
        await newReservation.save();
        res.status(201).json(newReservation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating reservation', error });
    }
};

// Get all reservations
exports.getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find().populate('facilityId');
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservations', error });
    }
};

// Get user's reservations
exports.getUserReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ fullName: req.params.fullName });
        if (reservations.length === 0) {
            return res.status(404).json({ message: 'No reservations found for this user' });
        }
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservations', error });
    }
};

// Update reservation status
exports.updateReservationStatus = async (req, res) => {
    try {
        const { reservationId, status } = req.body;
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        reservation.status = status;
        await reservation.save();
        res.status(200).json({ message: 'Reservation status updated', reservation });
    } catch (error) {
        res.status(500).json({ message: 'Error updating reservation', error });
    }
};

const mongoose = require('mongoose');


// Controller function to get reservations by userId
exports.getReservationsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId; // Get userId from request parameters
    console.log('Request received for user ID:', userId);

    // Ensure userId is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid user ID format:', userId);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Fetch reservations for the user
    const reservations = await Reservation.find({ userId }) // Use userId directly as a string
      .populate('facilityId', 'facilityName'); // Optionally populate facility details

    console.log('Reservations found:', reservations);

    // Check if reservations were found
    if (!reservations || reservations.length === 0) {
      console.log('No reservations found for this user.');
      return res.status(404).json({ message: 'No reservations found for this user.' });
    }

    // Return the reservations
    res.status(200).json(reservations);
  } catch (error) {
    console.error('Error fetching reservations by user ID:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a reservation
exports.deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findByIdAndDelete(id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        res.status(200).json({ message: 'Reservation deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting reservation', error });
    }
};
// Get reservations by facility ID





exports.getAvailableReservations = async (req, res) => {
    try {
        const { facilityId } = req.params;

        // Validate facilityId
        if (!facilityId) {
            console.error('Facility ID is missing');
            return res.status(400).json({ message: 'Facility ID is required' });
        }

        console.log(`Searching for facility with ID: ${facilityId}`);
        const facility = await Facility.findById(facilityId);
        if (!facility) {
            console.error(`Facility with ID ${facilityId} not found`);
            return res.status(404).json({ message: 'Facility not found' });
        }

        console.log('Checking facility availability information');
        if (!facility.availability || !facility.availability.timeRange) {
            console.error('Facility availability information is missing');
            return res.status(400).json({ message: 'Facility availability information is missing' });
        }

        // Fetch reservations for the facility
        console.log('Fetching reservations for facility');
        const reservations = await Reservation.find({ facilityId });
        console.log('Fetched reservations:', reservations);

        const availableSlotsData = [];
        const { startDay, endDay, timeRange } = facility.availability;

        // Get day range
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const startIndex = dayNames.indexOf(startDay);
        const endIndex = dayNames.indexOf(endDay);
        
        // Generate available slots for each day of the week within the specified range
        for (let dayOffset = startIndex; dayOffset <= endIndex; dayOffset++) {
            const date = new Date();
            date.setDate(date.getDate() + dayOffset);
            const dayName = dayNames[dayOffset % 7]; // Loop around the week
            const formattedDate = date.toISOString().split('T')[0]; // Store formatted date

            // Check reservations for the specific day
            const dayReservations = reservations.filter(reservation => {
                const reservationDate = new Date(reservation.reservationDate);
                return reservationDate.toISOString().split('T')[0] === formattedDate; // Check against formatted date
            });

            // Get available time slots for this day
            const availableSlots = getAvailableTimeSlots(timeRange, dayReservations);
            availableSlotsData.push({ day: dayName, date: formattedDate, slots: availableSlots });
        }

        console.log('Returning available slots');
        res.status(200).json(availableSlotsData);
    } catch (error) {
        console.error('Detailed Error:', error);
        res.status(500).json({
            message: 'Error fetching available reservations',
            error: error.message || error
        });
    }
};

const getAvailableTimeSlots = (timeRange, reservations) => {
    const startTime = parseTime(timeRange.startTime);
    const endTime = parseTime(timeRange.endTime);
    console.log('Start Time:', startTime);
    console.log('End Time:', endTime);
    
    const allSlots = generateHourlySlots(startTime, endTime);
    console.log('All Slots:', allSlots);

    // Filter out reserved slots
    let availableSlots = allSlots.filter(slot => {
        return !reservations.some(reservation => {
            const reservationStart = parseTime(reservation.startTime);
            const reservationEnd = parseTime(reservation.endTime);
            return isOverlapping(slot, { start: reservationStart, end: reservationEnd });
        });
    });

    console.log('Available Slots:', availableSlots); // Log available slots
    return availableSlots;
};


// Helper function to parse time strings to Date objects
const parseTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    console.log(`Parsed time for ${time}:`, date); // Log parsed time
    return date;
};
// Generate hourly slots between two time points
// Generate hourly slots between two time points
const generateHourlySlots = (start, end) => {
    const slots = [];
    let current = new Date(start);

    while (current < end) {
        const nextHour = new Date(current);
        nextHour.setHours(current.getHours() + 1);
        
        // Only add the slot if it doesn't exceed the end time
        if (nextHour <= end) {
            slots.push({
                start: current.toTimeString().substring(0, 5),
                end: nextHour.toTimeString().substring(0, 5)
            });
        }

        current.setHours(current.getHours() + 1);
    }
    return slots;
};

// Function to check if two time slots overlap
const isOverlapping = (slot1, slot2) => {
    return slot1.start < slot2.end && slot1.end > slot2.start;
};
