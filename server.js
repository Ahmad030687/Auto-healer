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

app.get('/', (req, res) => res.send("Master Surgeon Bot B is Online! 🏥🚑"));

app.post('/fix-it', async (req, res) => {
    const { error, filename, code } = req.body;
    console.log(`[ALERT] Surgery requested for: ${filename}`);

    try {
        // 1. AI Analysis - AI ko batana ke ye har kism ka error theek kare
        console.log(`[AI] Fixing code with Llama-3...`);
        const aiRes = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{
                role: "system",
                content: "You are a Master Node.js Developer. Fix any error in the code (API death, syntax, logic). If an API is dead, replace it with a working alternative if possible. Return ONLY raw code. No talk, no backticks."
            }, {
                role: "user",
                content: `Error: ${error}\n\nFile: ${filename}\n\nCode:\n${code}`
            }]
        }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } });

        let fixedCode = aiRes.data.choices[0].message.content.replace(/```javascript|```/g, "").trim();

        // 2. GitHub Path Verification
        let finalPath = filename;
        try {
            // Check agar file wahan mojood hai
            const { data: fileData } = await octokit.repos.getContent({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path: finalPath
            });

            // 3. Update File
            await octokit.repos.createOrUpdateFileContents({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path: finalPath,
                message: `🤖 God-Mode Fix: ${error.substring(0, 30)}`,
                content: Buffer.from(fixedCode).toString('base64'),
                sha: fileData.sha
            });

            console.log(`✅ Surgery Successful: ${finalPath} is fixed!`);
            res.status(200).send("Fixed!");

        } catch (pathErr) {
            // Agar rasta nahi milta toh search karein (Detective Mode)
            console.log("[SEARCHING] Path not found, looking for file...");
            const pureName = filename.split('/').pop();
            const { data: search } = await octokit.search.code({
                q: `filename:${pureName} repo:${REPO_OWNER}/${REPO_NAME}`
            });

            if (search.total_count > 0) {
                const newPath = search.items[0].path;
                const { data: newData } = await octokit.repos.getContent({
                    owner: REPO_OWNER,
                    repo: REPO_NAME,
                    path: newPath
                });

                await octokit.repos.createOrUpdateFileContents({
                    owner: REPO_OWNER,
                    repo: REPO_NAME,
                    path: newPath,
                    message: `🤖 Auto-Detective Fix: ${pureName}`,
                    content: Buffer.from(fixedCode).toString('base64'),
                    sha: newData.sha
                });
                console.log(`✅ Fixed after search: ${newPath}`);
                res.status(200).send("Fixed via search!");
            } else {
                throw new Error("File not found anywhere in repo.");
            }
        }

    } catch (err) {
        console.error("❌ Surgery Failed:", err.message);
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Surgeon is ready on port ${PORT}`));
