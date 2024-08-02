require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jobRoutes = require("./routes/jobRoutes");
const skillRoutes = require("./routes/skillRoutes");
const { fetchAndSaveJobs } = require("./controllers/fetchJobsController");
const cron = require("node-cron");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Routes
app.use("/api/jobs", jobRoutes);
app.use("/api/job-skills", skillRoutes);

// Cron job for fetching and saving jobs every 5 minutes
cron.schedule("*/1 * * * *", async () => {
  try {
    await fetchAndSaveJobs();
    io.emit("jobsUpdated");
  } catch (error) {
    console.error("Error in scheduled job fetch:", error);
  }
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start server
server.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  await fetchAndSaveJobs(); // Initial fetch when server starts
});
