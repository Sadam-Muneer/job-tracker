const Job = require("../models/Job");

// Fetch jobs with filtering
exports.getJobs = async (req, res) => {
  const { filter } = req.query;
  const today = new Date();
  const filters = {};

  if (filter === "today") {
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    filters.createdAt = { $gte: startOfDay, $lte: endOfDay };
  } else if (filter === "lastWeek") {
    const endOfWeek = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - 7));
    filters.createdAt = { $gte: startOfWeek, $lt: endOfWeek };
  } else if (filter === "lastMonth") {
    const endOfMonth = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.setMonth(today.getMonth() - 1));
    filters.createdAt = { $gte: startOfMonth, $lt: endOfMonth };
  }

  try {
    const jobs = await Job.find(filters).sort({ createdAt: -1 });
    if (jobs.length === 0) {
      return res.json({ message: "No jobs found for the selected filter." });
    }
    res.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};
