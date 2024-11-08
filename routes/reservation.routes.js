const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const middleware = require('../middleware/auth.middleware') // Adjust path as necessary

// Define your routes here
router.post('/add', middleware, reservationController.createReservation);
router.get('/available/:facilityId', reservationController.getAvailableReservations); // Route for getting available reservations
router.get('/', reservationController.getAllReservations); // Route for getting all reservations
router.get('/:fullName', reservationController.getUserReservations); // Route for getting reservations by user's full name
router.put('/update-status', reservationController.updateReservationStatus); // Route for updating reservation status
router.delete('/delete/:id', reservationController.deleteReservation); // Route for deleting a reservation by ID
router.get('/user/:userId', reservationController.getReservationsByUserId);

// Export the router
module.exports = router;
