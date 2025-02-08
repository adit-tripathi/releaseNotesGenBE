const express = require("express");
const axios = require("axios");
const OpenAI = require("openai-api");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI(OPENAI_API_KEY);

app.use(cors());
app.use(express.json());

app.post("/api/generate-release-notes", async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) return res.status(400).json({ error: "Repository URL is required" });

  try {
    const repoPath = repoUrl.replace("https://github.com/", "");
    const commitsUrl = `https://api.github.com/repos/${repoPath}/commits`;
    const prsUrl = `https://api.github.com/repos/${repoPath}/pulls?state=closed`;

    console.log(`Fetching commits from: ${commitsUrl}`);
    console.log(`Fetching pull requests from: ${prsUrl}`);

    const [commitsResponse, prsResponse] = await Promise.all([
      axios.get(commitsUrl),
      axios.get(prsUrl)
    ]);

    const commits = commitsResponse.data.map(commit => `- ${commit.commit.message}`).join("\n");
    const pullRequests = prsResponse.data.map(pr => `- PR #${pr.number}: ${pr.title}`).join("\n");

    res.json({ notes: `## Release Notes\n\n### Features & Fixes\n${commits}\n\n### Merged Pull Requests\n${pullRequests}` });
  } catch (error) {
    console.error("GitHub API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch commits and pull requests", details: error.response?.data || error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));