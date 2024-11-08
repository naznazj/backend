const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Public Routes
router.post('/register', authController.register);       // User Registration
router.post('/login', authController.login);         
router.post('/some-protected-route', authController.renewToken, (req, res) => {
    res.status(200).json({ message: 'You are authenticated!' });
});
    // User Login

// Admin Routes (should be protected by an admin authentication middleware)
router.post('/admin/add-user', authController.addUser);        // Admin adds a new user
router.get('/users', authController.fetchAllUsers);
router.get('/admin/view-users', authController.viewAllUsers);  // Admin views all users
router.get('/admin/view-user/:id', authController.viewUser);   // Admin views a specific user by ID
router.put('/admin/edit-user/:id', authController.editUser);   // Admin edits a user by ID
router.delete('/admin/delete-user/:id', authController.deleteUser); // Admin deletes a user by ID

module.exports = router;
