const express = require('express');
const axios = require('axios');
const { Octokit } = require("@octokit/rest");

const app = express();
app.use(express.json());

// --- CONFIGURATION ---
const GITHUB_TOKEN = process.env.G_TOKEN;
const GROQ_API_KEY = "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";
const REPO_OWNER = "Ahmad030687"; 
const REPO_NAME = "Nnn";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

app.get('/', (req, res) => res.send("AI Full-Bot Scanner is LIVE! 🔍🚑"));

app.post('/fix-it', async (req, res) => {
    const { error, filename, code } = req.body;
    
    // Sirf file ka naam nikalna (e.g., jail.js)
    const pureFileName = filename.split('/').pop();
    console.log(`[SCANNER] Searching for ${pureFileName} in the whole bot...`);

    try {
        // 1. POORA BOT SCAN KARNA (Search API)
        // Ye search karega ke ye file 'Nnn' repo mein kahan chhupi hai
        const { data: searchResults } = await octokit.search.code({
            q: `filename:${pureFileName} repo:${REPO_OWNER}/${REPO_NAME}`
        });

        let finalPath = filename; // Default path
        if (searchResults.total_count > 0) {
            // Agar file mil gayi (e.g. Priyansh/commands/jail.js), toh uska rasta pakar lo
            finalPath = searchResults.items[0].path;
            console.log(`[FOUND] File located at: ${finalPath}`);
        } else {
            console.log(`[WARNING] File not found in search, using provided path: ${finalPath}`);
        }

        // 2. AI SURGERY
        console.log(`[AI] Analyzing and fixing: ${finalPath}`);
        const aiRes = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{
                role: "system",
                content: "You are an expert Node.js developer. Fix the provided code. Ensure all used libraries (canvas, axios, fs) are properly required at the top. Return ONLY raw code without any explanations or markdown backticks."
            }, {
                role: "user",
                content: `Error: ${error}\n\nFile Path: ${finalPath}\n\nOriginal Code:\n${code}`
            }]
        }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } });

        let fixedCode = aiRes.data.choices[0].message.content.replace(/```javascript|```/g, "").trim();

        // 3. GET FILE SHA (GitHub update ke liye zaroori hai)
        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNer,
            repo: REPO_NAME,
            path: finalPath
        });

        // 4. PUSH FIXED CODE TO GITHUB
        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNer,
            repo: REPO_NAME,
            path: finalPath,
            message: `🤖 AI Auto-Fix: Resolved crash in ${pureFileName}`,
            content: Buffer.from(fixedCode).toString('base64'),
            sha: fileData.sha
        });

        console.log(`✅ GitHub Updated! ${pureFileName} is now fixed at ${finalPath}`);
        res.status(200).send("Surgery Successful!");

    } catch (err) {
        console.error("❌ Surgery Failed:", err.message);
        res.status(500).send("Scanner error: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Full-Bot Surgeon ready on port ${PORT}`));
