import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Joblistings.css";

const Joblistings = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState("");
  const [expandedJobs, setExpandedJobs] = useState(new Set());
  const [webSocketError, setWebSocketError] = useState(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const skillFilter = queryParams.get("skill");
  let socket;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "https://job-tracker-zeta.vercel.app/api/jobs",
        {
          params: { filter },
        }
      );
      const sortedJobs = (response.data.jobs || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setJobs(sortedJobs);
    } catch (error) {
      console.error("API Error:", error);
      if (error.response) {
        setError(
          `Error: ${error.response.status} ${error.response.statusText}`
        );
      } else if (error.request) {
        setError("Error: No response received from the server.");
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchJobs();

    // Set up a timer to refresh jobs every 5 minutes
    const intervalId = setInterval(fetchJobs, 5 * 60 * 1000);

    // Clean up the timer on component unmount
    return () => clearInterval(intervalId);
  }, [fetchJobs]);

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

    if (skillFilter) {
      filtered = filtered.filter((job) =>
        job.skills.some((skill) =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      );
    }

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
  }, [filter, jobs, searchInput, skillFilter]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

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

  useEffect(() => {
    const connectWebSocket = () => {
      socket = new WebSocket(
        "wss://job-tracker-zeta.vercel.app/socket.io/?EIO=3&transport=websocket"
      );

      socket.onopen = () => {
        console.log("WebSocket connection established.");
        setWebSocketError(null); // Clear any previous WebSocket errors
      };

      socket.onmessage = (event) => {
        if (event.data === "jobsUpdated") {
          fetchJobs();
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setWebSocketError("Error: WebSocket connection issue.");
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed.");
        setWebSocketError(
          "WebSocket connection lost. Data may not be updated."
        );

        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      return () => {
        if (socket) {
          socket.close(); // Clean up WebSocket connection on component unmount
        }
      };
    };

    connectWebSocket(); // Establish WebSocket connection

    // Clean up WebSocket connection on component unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [fetchJobs]);

  return (
    <div className="container mt-5 py-5">
      <h1 className="mb-4 pt-3">Job Listings ({filteredJobs.length})</h1>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : webSocketError ? (
        <div className="alert alert-warning">{webSocketError}</div>
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
            {filteredJobs.length > 0
              ? filteredJobs.map((job, index) => (
                  <div key={index} className="col-lg-4 col-md-6 mb-4">
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
                ))
              : null}
          </div>
        </>
      )}
    </div>
  );
};

export default Joblistings;
