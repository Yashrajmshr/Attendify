const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { db } = require('./config/firebase');

// db is already initialized in config/firebase.js
// connectDB(); // Removed SQL connection

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server running on port ${PORT}`));

// const functions = require('firebase-functions');
// exports.api = functions.https.onRequest(app);
