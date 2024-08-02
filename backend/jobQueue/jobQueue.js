const Queue = require("bull");
const { fetchAndSaveJobs } = require("../controllers/fetchJobsController");

const jobQueue = new Queue("jobQueue", {
  redis: { host: "localhost", port: 6379 },
});

jobQueue.process(async () => {
  console.log("Processing job from queue...");
  try {
    await fetchAndSaveJobs();
    console.log("Job processing complete.");
  } catch (error) {
    console.error("Error processing job:", error);
  }
});

jobQueue.on("completed", (job) => {
  console.log(`Job completed with result: ${job.result}`);
});

jobQueue.on("failed", (job, err) => {
  console.error(`Job failed with error: ${err}`);
});

module.exports = jobQueue;
