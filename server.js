const express = require('express');
const axios = require('axios');
const { Octokit } = require("@octokit/rest");

const app = express();
app.use(express.json());

// --- AAPKI SETTINGS ---
const GITHUB_TOKEN = "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";
const GROQ_API_KEY = "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";
const REPO_OWNer = "Ahmad030687"; 
const REPO_NAME = "Nnn";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

app.get('/', (req, res) => res.send("Mano Fixer (Bot B) is LIVE! 🏥"));

app.post('/fix-it', async (req, res) => {
    const { error, filename, code } = req.body;
    console.log(`[ALERT] Fixing crash in: ${filename}`);

    try {
        // 1. AI se solution mangna
        const aiRes = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{
                role: "system",
                content: "You are an expert Node.js developer. Fix the provided code. Return ONLY the full fixed code. No talk, no backticks, no markdown. Just the raw code."
            }, {
                role: "user",
                content: `Error: ${error}\n\nFile: ${filename}\n\nCode Content:\n${code}`
            }]
        }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } });

        let fixedCode = aiRes.data.choices[0].message.content;

        // 2. GitHub se purani file ki SHA nikalna (Zaroori hai update ke liye)
        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNer,
            repo: REPO_NAME,
            path: filename
        });

        // 3. GitHub par sahi code push karna
        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNer,
            repo: REPO_NAME,
            path: filename,
            message: `🤖 Auto-Fix: Resolved ${error.substring(0, 50)}`,
            content: Buffer.from(fixedCode).toString('base64'),
            sha: fileData.sha
        });

        console.log("✅ GitHub Updated! Render will now auto-redeploy Bot A.");
        res.status(200).send("Fixed and Pushed!");

    } catch (err) {
        console.error("❌ Surgery Failed:", err.message);
        res.status(500).send("Error during fixing");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Surgeon Bot B is ready on port ${PORT}`));

