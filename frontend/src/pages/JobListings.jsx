import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Joblistings.css";

const socket = io("http://localhost:3000"); // Adjust the URL if necessary

const Joblistings = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState("");
  const [expandedJobs, setExpandedJobs] = useState(new Set());

  // Function to fetch jobs from the API
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "https://job-tracker-zeta.vercel.app/api/jobs",
        { params: { filter } }
      );
      const sortedJobs = (response.data.jobs || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setJobs(sortedJobs);
    } catch (error) {
      console.error("API Error:", error);
      setError("Error fetching jobs");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch jobs and set up WebSocket listener
  useEffect(() => {
    fetchJobs();

    socket.on("jobsUpdated", () => {
      console.log("Jobs updated via WebSocket");
      fetchJobs();
    });

    const intervalId = setInterval(fetchJobs, 1 * 60 * 1000); // Refresh every 5 minutes

    return () => {
      socket.off("jobsUpdated");
      clearInterval(intervalId); // Clear the interval on component unmount
    };
  }, [fetchJobs]);

  // Apply filters to the jobs list
  const applyFilter = useCallback(() => {
    const today = new Date();
    let filtered = jobs.filter((job) => {
      const createdAt = new Date(job.createdAt);

      if (filter === "today") {
        return createdAt.toDateString() === today.toDateString();
      } else if (filter === "lastWeek") {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        return createdAt >= oneWeekAgo && createdAt <= today;
      } else if (filter === "lastMonth") {
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        return createdAt >= oneMonthAgo && createdAt <= today;
      } else {
        return true; // For "All Jobs"
      }
    });

    const lowercasedSearchInput = searchInput.toLowerCase();
    const finalFilteredJobs = filtered.filter((job) => {
      const skills = Array.isArray(job.skills) ? job.skills.join(", ") : "";
      const category = typeof job.category === "string" ? job.category : "";

      return (
        skills.toLowerCase().includes(lowercasedSearchInput) ||
        category.toLowerCase().includes(lowercasedSearchInput)
      );
    });

    setFilteredJobs(finalFilteredJobs);
  }, [filter, jobs, searchInput]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  // Handle input changes for search
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  // Handle filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Toggle job expand/collapse
  const toggleJobExpand = (jobId) => {
    setExpandedJobs((prev) => {
      const newExpandedJobs = new Set(prev);
      if (newExpandedJobs.has(jobId)) {
        newExpandedJobs.delete(jobId);
      } else {
        newExpandedJobs.add(jobId);
      }
      return newExpandedJobs;
    });
  };

  return (
    <div className="container mt-5 py-5">
      <h1 className="mb-4 pt-3">Job Listings ({filteredJobs.length})</h1>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <h5>Search:</h5>
          <div className="row mb-5">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInputChange}
                className="form-control"
                placeholder="Search by skills or category"
              />
            </div>

            <div className="col-12 col-md-6">
              <div className="row g-2">
                <div className="col-6 col-md-6">
                  <button
                    onClick={() => handleFilterChange("today")}
                    className={`btn btn-secondary w-100 h-100 ${
                      filter === "today" ? "active" : ""
                    }`}
                  >
                    Today
                  </button>
                </div>
                <div className="col-6 col-md-6">
                  <button
                    onClick={() => handleFilterChange("lastWeek")}
                    className={`btn btn-secondary w-100 h-100 ${
                      filter === "lastWeek" ? "active" : ""
                    }`}
                  >
                    Last Week
                  </button>
                </div>
                <div className="col-6 col-md-6">
                  <button
                    onClick={() => handleFilterChange("lastMonth")}
                    className={`btn btn-secondary w-100 h-100 ${
                      filter === "lastMonth" ? "active" : ""
                    }`}
                  >
                    Last Month
                  </button>
                </div>
                <div className="col-6 col-md-6">
                  <button
                    onClick={() => handleFilterChange("")}
                    className={`btn btn-secondary w-100 h-100 ${
                      filter === "" ? "active" : ""
                    }`}
                  >
                    All Jobs
                  </button>
                </div>
              </div>
            </div>
          </div>

          {filteredJobs.length === 0 && (
            <div className="alert alert-info">No jobs available</div>
          )}

          <div className="row">
            {filteredJobs.map((job) => (
              <div key={job._id} className="col-lg-4 col-md-6 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">{job.title}</h5>
                    <p className="card-text">
                      <strong>Category:</strong> {job.category}
                    </p>
                    <p className="card-text">
                      <strong>Skills:</strong> {job.skills.join(", ")}
                    </p>
                    <p className="card-text">
                      <strong>Budget:</strong> {job.budget}
                    </p>
                    <p className="card-text">
                      <strong>Hourly Range:</strong> {job.hourlyRange}
                    </p>
                    <p className="card-text">
                      <strong>Country:</strong> {job.country}
                    </p>
                    <p className="card-text">
                      <strong>Created At:</strong>{" "}
                      {new Date(job.createdAt).toLocaleString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>

                    <button
                      className="btn btn-secondary mt-2"
                      onClick={() => toggleJobExpand(job._id)}
                    >
                      {expandedJobs.has(job._id) ? "Collapse" : "Expand"}
                    </button>

                    {expandedJobs.has(job._id) && (
                      <div className="mt-2">
                        <h6>Job Description:</h6>
                        <p>{job.description}</p>
                        {job.applyLinks && job.applyLinks.length > 0 && (
                          <div>
                            {job.applyLinks.map((link, index) => (
                              <a
                                key={index}
                                href={link}
                                className="btn btn-secondary me-2"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Apply Now
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Joblistings;
