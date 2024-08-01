const Job = require("../models/Job");

// Fetch job skills and their counts
exports.getJobSkills = async (req, res) => {
  const { startDate, endDate } = req.query;

  const filters = {};

  if (startDate && endDate) {
    filters.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  try {
    const jobs = await Job.find(filters);

    const skillsCount = {};

    jobs.forEach((job) => {
      job.skills.forEach((skill) => {
        if (skillsCount[skill]) {
          skillsCount[skill]++;
        } else {
          skillsCount[skill] = 1;
        }
      });
    });

    const skills = Object.keys(skillsCount);
    const counts = Object.values(skillsCount);

    res.json({ skills, counts });
  } catch (error) {
    console.error("Error fetching skills data:", error);
    res.status(500).json({ message: "Error fetching skills data" });
  }
};
