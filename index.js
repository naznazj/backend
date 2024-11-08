const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db'); // Ensure this path is correct
const path = require('path'); // Import path module
require('dotenv').config(); // Load environment variables

const app = express();

// Connect to MongoDB
connectDB(); // Call the connectDB function here

app.use(cors({
    origin: 'http://localhost:4200' // Allow requests from Angular app
}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Backend');
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/facilities', require('./routes/facility.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/reservations', require('./routes/reservation.routes')); // Add reservation routes

// Serve static files
app.use('/assets/images/facilities', express.static(path.join(__dirname, 'assets/images/facilities')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
