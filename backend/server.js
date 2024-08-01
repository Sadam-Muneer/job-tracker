const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const { fetchAndSaveJobs } = require('./controllers/fetchJobsController');
const jobRoutes = require('./routes/jobRoutes');
const skillRoutes = require('./routes/skillRoutes');
require('dotenv').config(); // Add this line to load environment variables

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use('/api/jobs', jobRoutes);
app.use('/api/job-skills', skillRoutes);

mongoose.connect(process.env.MONGO_URI, {
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Schedule job fetching
cron.schedule('*/5 * * * *', async () => {
  try {
    await fetchAndSaveJobs();
    io.emit('jobsUpdated'); // Notify clients of update
    console.log('Jobs updated in database and clients notified');
  } catch (error) {
    console.error('Error in scheduled job fetch:', error);
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});
