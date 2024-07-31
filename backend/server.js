require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jobRoutes = require('./routes/jobRoutes');
const skillRoutes = require('./routes/skillRoutes');
const { fetchAndSaveJobs } = require('./controllers/fetchJobsController');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {

})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/job-skills', skillRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  fetchAndSaveJobs();
});
