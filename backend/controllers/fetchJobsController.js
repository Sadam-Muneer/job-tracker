const mongoose = require("mongoose");
const Job = require("../models/Job");
const Parser = require("rss-parser");
const { JSDOM } = require("jsdom");

const parser = new Parser();

exports.fetchAndSaveJobs = async () => {
                    try {
                                        const feed = await parser.parseURL("https://www.upwork.com/ab/feed/jobs/rss");
                                        const newJobs = feed.items.map((item) => {
                                                            const dom = new JSDOM(item.content);
                                                            const description = dom.window.document.body.textContent;

                                                            // Extract apply links from anchor tags
                                                            const applyLinks = Array.from(dom.window.document.querySelectorAll('a')).map(anchor => anchor.href);

                                                            const hourlyRangeMatch = description.match(/(?:Hourly\s*Rate|Hourly\s*Range)\s*:\s*([\d\s\$\-]+)/i);
                                                            const budgetMatch = description.match(/Budget\s*:\s*([\d\s\$\-]+)/i);
                                                            const categoryMatch = description.match(/Category\s*:\s*([^\n]+)/i);
                                                            const countryMatch = description.match(/Country\s*:\s*([^\n]+)/i);
                                                            const skillsMatch = description.match(/(?:Skills|Required Skills)\s*:\s*([^\n]+)/i);

                                                            const formattedDescription = description
                                                                                .replace(/(?:Hourly\s*Rate|Hourly\s*Range|Budget|Category|Country|Skills|Required Skills):[^\n]*\n?/gi, "")
                                                                                .trim();

                                                            const uniqueSkills = skillsMatch ? skillsMatch[1].split(",").map((skill) => skill.trim()) : [];

                                                            return {
                                                                                title: item.title || "No title available",
                                                                                pubDate: new Date(item.pubDate),
                                                                                description: formattedDescription || "No description available",
                                                                                category: categoryMatch ? categoryMatch[1].trim() : "No category available",
                                                                                skills: uniqueSkills,
                                                                                budget: budgetMatch ? budgetMatch[1].trim() : "No budget available",
                                                                                hourlyRange: hourlyRangeMatch ? hourlyRangeMatch[1].trim() : "No hourly range available",
                                                                                country: countryMatch ? countryMatch[1].trim() : "No country available",
                                                                                applyLinks: applyLinks.length > 0 ? applyLinks : [], // Use extracted links
                                                                                createdAt: new Date(),
                                                            };
                                        });

                                        for (const job of newJobs) {
                                                            await Job.updateOne({ title: job.title, pubDate: job.pubDate }, job, {
                                                                                upsert: true,
                                                            });
                                        }

                                        console.log("Jobs updated in MongoDB");
                    } catch (error) {
                                        console.error("Error fetching and saving jobs:", error);
                    }
};
