require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const { setSocketIO: setReadingSocketIO } = require('./services/readingService');
const { setSocketIO: setAlertSocketIO } = require('./services/ai/alertService');
const { seedAll } = require('./utils/seedData');
const User = require('./models/User');

// Routes
const authRoutes = require('./routes/authRoutes');
const readingRoutes = require('./routes/readingRoutes');
const baselineRoutes = require('./routes/baselineRoutes');
const alertRoutes = require('./routes/alertRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const insightRoutes = require('./routes/insightRoutes');
const caregiverRoutes = require('./routes/caregiverRoutes');
const consentRoutes = require('./routes/consentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const checkupRoutes = require('./routes/checkupRoutes');
const observationRoutes = require('./routes/observationRoutes');
const recheckRoutes = require('./routes/recheckRoutes');
const activityRoutes = require('./routes/activityRoutes');
const trendRoutes = require('./routes/trendRoutes');
const { getDashboardData } = require('./controllers/readingController');
const { protect } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

setReadingSocketIO(io);
setAlertSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.IO Room Management
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
    }
  });

  socket.on('join_caregiver_room', (patientId) => {
    if (patientId) {
      socket.join(`caregiver_of_${patientId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined caregiver_of_${patientId}`);
    }
  });

  // Client live sensing telemetry stream
  socket.on('live_sensing_tick', (payload) => {
    if (payload && payload.userId) {
      io.to(`user_${payload.userId}`).emit('live_sensing_update', payload);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VitaBridge AI Multimodal Human Sensing Platform',
    tagline: 'Sense. Understand. Recheck. Warn Early.',
    version: '1.0.0',
    disclaimer: 'VitaBridge AI is a health screening and early-warning/decision-support platform, NOT a replacement for a doctor. Never present an AI prediction as a confirmed diagnosis.',
    timestamp: new Date(),
  });
});

// Section 21 Primary REST Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingRoutes);
app.get('/api/dashboard', protect, getDashboardData); // Root GET /api/dashboard
app.use('/api/camera-observations', (req, res, next) => {
  req.url = '/camera-observations';
  observationRoutes(req, res, next);
});
app.use('/api/audio-observations', (req, res, next) => {
  req.url = '/audio-observations';
  observationRoutes(req, res, next);
});
app.use('/api/baseline', baselineRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/recheck', recheckRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/caregiver', caregiverRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/checkup', checkupRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[VitaBridge Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server & Check DB
const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[VitaBridge DB] No users detected. Automatically populating realistic demo data...');
      await seedAll();
    }

    server.listen(PORT, () => {
      console.log(`
=========================================================
  VitaBridge AI Server Running on Port ${PORT}
  API Base: http://localhost:${PORT}/api
  Tagline: "Sense. Understand. Recheck. Warn Early."
  Decision-Support Guarantee: Active & Guardrailed
=========================================================
      `);
    });
  })
  .catch((err) => {
    console.error('[VitaBridge Boot Error] Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = { app, server };
