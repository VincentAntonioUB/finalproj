require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI?.trim();
let isMongoConnected = false;

const Attendance = mongoose.model('attendance', new mongoose.Schema(
    {
        studentName: { type: String, required: true, trim: true },
        studentId: { type: String, required: true, trim: true },
        attendanceAt: { type: Date, required: true, default: Date.now },
        status: { type: String, required: true, enum: ['Present', 'Absent', 'Late'] },
        remarks: { type: String, trim: true, default: '' }
    },
    { timestamps: true }
));

app.get('/api/attendance', async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const attendanceRecords = await Attendance.find().sort({ attendanceAt: -1, createdAt: -1 });
        res.send(attendanceRecords);
        console.log('Fetched all attendance records');
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch attendance records.' });
    }
});

app.get('/api/attendance/:id', async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const record = await Attendance.findById(req.params.id);
        if (!record) {
            return res.status(404).send({ error: 'Attendance record not found.' });
        }
        res.send(record);
    } catch (error) {
        res.status(400).send({ error: 'Invalid attendance record ID.' });
    }
});

app.post('/api/attendance', async (req, res) =>{
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const attendanceRecord = new Attendance({
            studentName: req.body.studentName,
            studentId: req.body.studentId,
            status: req.body.status,
            remarks: req.body.remarks,
            attendanceAt: new Date()
        });
        await attendanceRecord.save();
        res.status(201).send(attendanceRecord);
        console.log('Added attendance record:', attendanceRecord.studentName);
    } catch (error) {
        res.status(400).send({ error: 'Failed to create attendance record.' });
    }
});

app.put('/api/attendance/:id', async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const updatePayload = {
            studentName: req.body.studentName,
            studentId: req.body.studentId,
            status: req.body.status,
            remarks: req.body.remarks
        };
        const updatedRecord = await Attendance.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true, runValidators: true }
        );
        if (!updatedRecord) {
            return res.status(404).send({ error: 'Attendance record not found.' });
        }
        res.send(updatedRecord);
    } catch (error) {
        res.status(400).send({ error: 'Failed to update attendance record.' });
    }
});

app.delete('/api/attendance/:id', async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const deletedRecord = await Attendance.findByIdAndDelete(req.params.id);
        if (!deletedRecord) {
            return res.status(404).send({ error: 'Attendance record not found.' });
        }
        res.send({ message: 'Attendance record deleted successfully.' });
    } catch (error) {
        res.status(400).send({ error: 'Failed to delete attendance record.' });
    }
});

if (!mongoUri) {
    console.error('Missing MONGODB_URI in .env. API started without database connection.');
}

mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
});

mongoose.connection.on('connected', () => {
    isMongoConnected = true;
    console.log('Connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
    isMongoConnected = false;
    console.log('MongoDB disconnected');
});

async function startServer() {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}!`);
    });

    if (!mongoUri) {
        return;
    }

    try {
        await mongoose.connect(mongoUri);
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
    }
}

startServer();