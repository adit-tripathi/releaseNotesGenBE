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

app.post('/api/generate-release-notes', async (req, res) => {
  const { repoUrl } = req.body;

  try {
    const repoPath = repoUrl.replace('https://github.com/', '');
    const commitsUrl = `https://api.github.com/repos/${repoPath}/commits?per_page=50`;

    const response = await axios.get(commitsUrl);
    const commits = response.data;

    const categorizedCommits = {
      features: [],
      fixes: [],
      chores: [],
      others: [],
    };

    // Categorize commits by type
    commits.forEach((commit) => {
      const message = commit.commit.message.toLowerCase();
      if (message.startsWith('feat:')) {
        categorizedCommits.features.push(commit.commit.message);
      } else if (message.startsWith('fix:')) {
        categorizedCommits.fixes.push(commit.commit.message);
      } else if (message.startsWith('chore:')) {
        categorizedCommits.chores.push(commit.commit.message);
      } else {
        categorizedCommits.others.push(commit.commit.message);
      }
    });

    // Generate summary
    const summary = `
Features: ${categorizedCommits.features.length} updates
${categorizedCommits.features.join('\n')}

Fixes: ${categorizedCommits.fixes.length} updates
${categorizedCommits.fixes.join('\n')}

Chores: ${categorizedCommits.chores.length} updates
${categorizedCommits.chores.join('\n')}

Others: ${categorizedCommits.others.length} updates
${categorizedCommits.others.join('\n')}
    `;

    res.json({ notes: summary });
  } catch (error) {
    console.error('Error fetching commits:', error);
    res.status(500).send('Failed to generate release notes');
  }
});

const fetchCommitsFromRepo = async (repoUrl) => {
  try {
    const repoPath = repoUrl.replace("https://github.com/", "");
    const commitsUrl = `https://api.github.com/repos/${repoPath}/commits?per_page=50`;

    const { data } = await axios.get(commitsUrl);
    const categorizedCommits = {
      features: [],
      fixes: [],
      chores: [],
      others: [],
    };

    data.forEach((commit) => {
      const message = commit.commit.message.toLowerCase();
      if (message.startsWith("feat:")) {
        categorizedCommits.features.push(message);
      } else if (message.startsWith("fix:")) {
        categorizedCommits.fixes.push(message);
      } else if (message.startsWith("chore:")) {
        categorizedCommits.chores.push(message);
      } else {
        categorizedCommits.others.push(message);
      }
    });

    return categorizedCommits;
  } catch (error) {
    console.error("Error fetching commits:", error);
    throw new Error("Failed to fetch commits.");
  }
};

app.post('/api/generate-release-notes-v2', async (req, res) => {
  const { repoUrl } = req.body;

  try {
    const commits = await fetchCommitsFromRepo(repoUrl); // Fetch commits logic
    const summary = `We made some exciting changes! This release includes ${
      commits.features.length
    } new features, ${commits.fixes.length} bug fixes, and ${
      commits.others.length
    } other updates.`;

    const detailedNotes = `
Features:\n${commits.features.join('\n')}
Fixes:\n${commits.fixes.join('\n')}
Others:\n${commits.others.join('\n')}
    `;

    res.json({ summary, notes: detailedNotes });
  } catch (error) {
    console.error('Error generating release notes:', error);
    res.status(500).send('Failed to generate release notes.');
  }
});



app.post("/api/generate-pdf", (req, res) => {
  const { notes } = req.body;

  if (!notes) {
    return res.status(400).send("Notes are required to generate PDF");
  }

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=release-notes.pdf");

  doc.pipe(res);
  doc.fontSize(16).text("Release Notes", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(notes, { align: "left" });
  doc.end();
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));