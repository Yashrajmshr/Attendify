const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

// Load .env from backend directory properly
dotenv.config({ path: path.join(__dirname, '.env') });

const { db } = require('./config/firebase');

app.use(express.json());
app.use(cors());

app.get('/api/test-server', (req, res) => {
    res.json({ message: 'Attendify Web Server Running', time: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/session', require('./routes/sessionRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));
app.use('/api/metadata', require('./routes/metadataRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Attendify Web Server Listening on port ${PORT}`);
});

// const functions = require('firebase-functions');
// exports.api = functions.https.onRequest(app);
