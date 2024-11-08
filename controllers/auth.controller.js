const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const jwtSecret = process.env.JWT_SECRET || 'default_secret_key'; // Manage secret key

// Login
exports.login = [
    body('email').isEmail().withMessage('Invalid email format.'),
    body('password').notEmpty().withMessage('Password is required.'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            const token = createToken(user);
            return res.json({ token, firstName: user.firstName, lastName: user.lastName, role: user.role });
        }
        
        res.status(401).json({ message: 'Invalid credentials' });
    }
];

// Function to create a token
const createToken = (user) => {
    return jwt.sign(
        {
            id: user._id,           // User's unique identifier
            firstName: user.firstName, // Include firstName in the token
            lastName: user.lastName,   // Include lastName in the token
            role: user.role,        // Include role in the token
        },
        jwtSecret, 
        { expiresIn: '1h' }
    );
};

// Middleware to check and renew token
exports.renewToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header

    if (token) {
        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Token is invalid or expired.' });
            }

            // Check if the token will expire within the next 10 minutes (600 seconds)
            const exp = decoded.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            if (exp - now < 10 * 60 * 1000) { // 10 minutes before expiration
                // Issue a new token
                const user = { 
                    _id: decoded.id,
                    firstName: decoded.firstName,
                    lastName: decoded.lastName,
                    role: decoded.role
                };
                const newToken = createToken(user);
                res.setHeader('Authorization', `Bearer ${newToken}`); // Set new token in the header
            }
            next();
        });
    } else {
        return res.status(401).json({ message: 'Authorization token is missing.' });
    }
};

// Register
exports.register = async (req, res) => {
    const { email, password, username, firstName, lastName, birthday, contactNumber, address } = req.body;

    // Validate input (for brevity, manual checks shown here; ideally use validation library)
    if (!email || !password || !username || !firstName || !lastName || !birthday || !contactNumber || !address) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, username, firstName, lastName, birthday, contactNumber, address, password: hashedPassword, role: 'user' });

    try {
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



// Add a new user by Admin
exports.addUser = async (req, res) => {
    const { email, password, username, firstName, lastName, birthday, contactNumber, address, role } = req.body;

    // Validate input
    if (!email || !password || !username || !firstName || !lastName || !birthday || !contactNumber || !address || !role) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
        email,
        username,
        firstName,
        lastName,
        birthday,
        contactNumber,
        address,
        password: hashedPassword,
        role
    });

    try {
        await newUser.save();
        res.status(201).json({ message: 'User added successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// View all users
exports.viewAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// View a specific user by ID
exports.viewUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.fetchAllUsers = async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from the database
        res.status(200).json(users); // Return the list of users
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Edit user by ID
exports.editUser = async (req, res) => {
    const { id } = req.params;
    const { email, username, firstName, lastName, birthday, contactNumber, address, role } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        user.email = email || user.email;
        user.username = username || user.username;
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.birthday = birthday || user.birthday;
        user.contactNumber = contactNumber || user.contactNumber;
        user.address = address || user.address;
        user.role = role || user.role;

        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }

    exports.getUserReservations = async (req, res) => {
        try {
            const userId = req.params.userId; // Get userId from request parameters
            const reservations = await Reservation.find({ userId });
            
            if (reservations.length === 0) {
                return res.status(404).json({ message: 'No reservations found for this user' });
            }
    
            res.status(200).json(reservations);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching reservations', error });
        }
    };
};
