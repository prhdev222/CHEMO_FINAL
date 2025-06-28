const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const morgan = require('morgan');
const app = express();
const patientRoutes = require('./routes/patient');
const appointmentRoutes = require('./routes/appointment');
const userRoutes = require('./routes/user');
const linkRoutes = require('./routes/links');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'], //, 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const now = new Date();
  const thaiTime = now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  res.json({ status: 'ok', time_utc: now.toISOString(), time_thai: thaiTime });
});

// ตัวอย่าง route หลัก (จะเพิ่ม route จริงในขั้นถัดไป)
app.get('/', (req, res) => {
  res.send('Chemo Dashboard Backend API');
});


// TODO: เพิ่ม route อื่น ๆ เช่น /api/patients, /api/appointments
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/links', linkRoutes);

// Error handler กลาง
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 