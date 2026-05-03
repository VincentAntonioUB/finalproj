require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI?.trim();
let isMongoConnected = false;

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/** @type {Map<string, { role: 'student' | 'admin'; studentId?: string; studentName?: string; username?: string; expiresAt: number }>} */
const sessions = new Map();

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const parts = stored.split(':');
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    try {
        const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
    } catch {
        return false;
    }
}

function createSession(payload) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(token, { ...payload, expiresAt });
    return token;
}

function getSessionFromRequest(req) {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
        return null;
    }
    const token = header.slice(7).trim();
    if (!token) return null;
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
        if (token) sessions.delete(token);
        return null;
    }
    return { token, session };
}

function requireStudent(req, res, next) {
    const found = getSessionFromRequest(req);
    if (!found || found.session.role !== 'student') {
        return res.status(401).send({ error: 'Student authentication required.' });
    }
    req.auth = found.session;
    req.authToken = found.token;
    next();
}

function requireAdmin(req, res, next) {
    const found = getSessionFromRequest(req);
    if (!found || found.session.role !== 'admin') {
        return res.status(401).send({ error: 'Admin authentication required.' });
    }
    req.auth = found.session;
    req.authToken = found.token;
    next();
}

const StudentAccount = mongoose.model(
    'studentaccount',
    new mongoose.Schema(
        {
            studentId: { type: String, required: true, unique: true, trim: true },
            studentName: { type: String, required: true, trim: true },
            passwordHash: { type: String, required: true }
        },
        { timestamps: true }
    )
);

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

app.post('/api/auth/register-student', async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const { studentId, studentName, password } = req.body || {};
        if (!studentId || !studentName || !password) {
            return res.status(400).send({ error: 'studentId, studentName, and password are required.' });
        }
        const idKey = String(studentId).trim();
        const exists = await StudentAccount.findOne({ studentId: idKey });
        if (exists) {
            return res.status(409).send({ error: 'Student ID is already registered.' });
        }
        const account = new StudentAccount({
            studentId: idKey,
            studentName: String(studentName).trim(),
            passwordHash: hashPassword(String(password))
        });
        await account.save();
        res.status(201).send({ message: 'Account created. You can sign in.' });
    } catch (error) {
        res.status(400).send({ error: 'Failed to register student.' });
    }
});

app.post('/api/auth/login-student', async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const { studentId, password } = req.body || {};
        if (!studentId || !password) {
            return res.status(400).send({ error: 'studentId and password are required.' });
        }
        const account = await StudentAccount.findOne({ studentId: String(studentId).trim() });
        if (!account || !verifyPassword(String(password), account.passwordHash)) {
            return res.status(401).send({ error: 'Invalid student ID or password.' });
        }
        const token = createSession({
            role: 'student',
            studentId: account.studentId,
            studentName: account.studentName
        });
        res.send({
            token,
            user: { role: 'student', studentId: account.studentId, studentName: account.studentName }
        });
    } catch (error) {
        res.status(500).send({ error: 'Login failed.' });
    }
});

app.post('/api/auth/login-admin', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).send({ error: 'username and password are required.' });
        }
        if (String(username).trim() !== ADMIN_USERNAME || String(password) !== ADMIN_PASSWORD) {
            return res.status(401).send({ error: 'Invalid admin credentials.' });
        }
        const token = createSession({
            role: 'admin',
            username: ADMIN_USERNAME
        });
        res.send({
            token,
            user: { role: 'admin', username: ADMIN_USERNAME }
        });
    } catch (error) {
        res.status(500).send({ error: 'Login failed.' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    const found = getSessionFromRequest(req);
    if (found?.token) {
        sessions.delete(found.token);
    }
    res.send({ message: 'Logged out.' });
});

app.get('/api/me/attendance', requireStudent, async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const records = await Attendance.find({ studentId: req.auth.studentId }).sort({
            attendanceAt: -1,
            createdAt: -1
        });
        res.send(records);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch your attendance records.' });
    }
});

app.get('/api/admin/students', requireAdmin, async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const fromAttendance = await Attendance.aggregate([
            { $sort: { attendanceAt: -1 } },
            { $group: { _id: '$studentId', studentName: { $first: '$studentName' } } },
            { $project: { _id: 0, studentId: '$_id', studentName: 1 } },
            { $sort: { studentId: 1 } }
        ]);
        const accounts = await StudentAccount.find().select('studentId studentName').lean();
        const map = new Map();
        for (const row of fromAttendance) {
            map.set(row.studentId, row.studentName);
        }
        for (const acc of accounts) {
            if (!map.has(acc.studentId)) {
                map.set(acc.studentId, acc.studentName);
            }
        }
        const list = [...map.entries()].map(([studentIdKey, studentName]) => ({ studentId: studentIdKey, studentName }));
        list.sort((a, b) => a.studentId.localeCompare(b.studentId));
        res.send(list);
    } catch (error) {
        res.status(500).send({ error: 'Failed to load student list.' });
    }
});

app.get('/api/admin/attendance', requireAdmin, async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).send({ error: 'Database is not connected yet.' });
    }
    try {
        const studentId = req.query.studentId ? String(req.query.studentId).trim() : '';
        const dateFrom = req.query.dateFrom ? String(req.query.dateFrom).trim() : '';
        const dateTo = req.query.dateTo ? String(req.query.dateTo).trim() : '';

        const filter = {};
        if (studentId) {
            filter.studentId = studentId;
        }
        if (dateFrom || dateTo) {
            filter.attendanceAt = {};
            if (dateFrom) {
                const start = new Date(dateFrom);
                start.setHours(0, 0, 0, 0);
                filter.attendanceAt.$gte = start;
            }
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                filter.attendanceAt.$lte = end;
            }
        }

        const attendanceRecords = await Attendance.find(filter).sort({ attendanceAt: -1, createdAt: -1 });
        res.send(attendanceRecords);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch attendance records.' });
    }
});

app.get('/api/attendance', requireAdmin, async (req, res) => {
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

app.get('/api/attendance/:id', requireAdmin, async (req, res) => {
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

app.put('/api/attendance/:id', requireAdmin, async (req, res) => {
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

app.delete('/api/attendance/:id', requireAdmin, async (req, res) => {
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