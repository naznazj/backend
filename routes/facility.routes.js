const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facility.controller'); // Adjust the path as necessary

// Define your routes here
router.get('/', facilityController.getAllFacilities); // Fetch all facilities with image URLs
router.get('/available', facilityController.getAvailableFacilities); // Fetch available facilities
router.post('/add', facilityController.addFacility);
router.put('/update/:id', facilityController.updateFacility);
router.get('/:id', facilityController.getFacilityById);
router.delete('/delete/:id', facilityController.deleteFacility);

// Export the router
module.exports = router;
