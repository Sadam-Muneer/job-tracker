const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Job = require('./models/Job'); // Adjust the path as necessary

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection and other middleware setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Setup Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Emit new job when a job is created or updated
  const jobChangeHandler = async () => {
    const jobs = await Job.find().sort({ createdAt: -1 });
    socket.emit('jobUpdates', jobs);
  };

  // Watch for changes in the jobs collection
  const changeStream = Job.watch();
  changeStream.on('change', jobChangeHandler);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    changeStream.close();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
