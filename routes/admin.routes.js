const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/users', authMiddleware, adminController.getUsers);
router.get('/facilities', authMiddleware, adminController.getFacilities);
router.post('/facilities', authMiddleware, adminController.addFacility);
router.put('/facilities/:id', authMiddleware, adminController.updateFacility);
router.delete('/facilities/:id', authMiddleware, adminController.deleteFacility);
router.get('/messages', authMiddleware, adminController.getMessages);

module.exports = router;
