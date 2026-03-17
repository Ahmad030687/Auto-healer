const express = require('express');
const axios = require('axios');
const { Octokit } = require("@octokit/rest");

const app = express();
app.use(express.json());

// --- AAPKI SETTINGS ---
const G_TOKEN = process.env.G_TOKEN; 
const GROQ_API_KEY = "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"; // Apni key hide rakha karein!
const REPO_OWNER = "Ahmad030687"; 
const REPO_NAME = "Nnn";

const octokit = new Octokit({ auth: G_TOKEN });

app.get('/', (req, res) => res.send("Mano Fixer (Bot B) is LIVE in GOD MODE! 🏥⚡"));

app.post('/fix-it', async (req, res) => {
    const { error, filename, code } = req.body;
    console.log(`[ALERT] Master Surgery Started on: ${filename}`);

    try {
        // 🔥 1. THE GOD-LEVEL SYSTEM PROMPT (Is se AI aukaat mein rahega)
        const systemPrompt = `You are a strict, elite-level Node.js repair AI for a Facebook Messenger Bot (Mirai Framework). 
        CRITICAL RULES (Violating these will crash the system):
        1. FIX ONLY THE ERROR. DO NOT modify any APIs, image URLs, string texts, or variable names.
        2. NEVER add 'utf-8' to Buffer.from() when handling images or streams. It corrupts them. Keep it as Buffer.from(data).
        3. DO NOT wrap the code in backticks or markdown like \`\`\`javascript.
        4. RETURN THE ENTIRE 100% COMPLETE FILE CODE. Do not use "// rest of the code".
        5. DO NOT change the 'module.exports.config' details.
        Just output the raw, fixed code starting directly with 'const' or 'module.exports'.`;

        const aiRes = await axios.post("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
            model: "llama-3.3-70b-versatile",
            messages: [{
                role: "system",
                content: systemPrompt
            }, {
                role: "user",
                content: `Fix this syntax/runtime error exactly without breaking original logic.\n\nError: ${error}\n\nFile: ${filename}\n\nCode Content:\n${code}`
            }]
        }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } });

        let fixedCode = aiRes.data.choices[0].message.content;

        // 🔥 2. THE MARKDOWN STRIPPER (Ziddi AI ka final ilaaj)
        // Agar AI phir bhi ```javascript lagata hai, toh ye usay kaat dega.
        fixedCode = fixedCode.replace(/^```(javascript|js)?\s*/i, ''); // Upar se ```javascript urayega
        fixedCode = fixedCode.replace(/```\s*$/i, ''); // Neeche se ``` urayega
        fixedCode = fixedCode.trim(); // Faltu spaces khatam karega

        if (!fixedCode || fixedCode.length < 50) {
            throw new Error("AI returned empty or invalid code!");
        }

        // 3. GitHub se purani file ki SHA nikalna
        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: filename
        });

        // 4. GitHub par 100% Sahi code push karna
        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: filename,
            message: `🤖 Auto-Fix (God Mode): Resolved ${error.substring(0, 40)}`,
            content: Buffer.from(fixedCode).toString('base64'),
            sha: fileData.sha
        });

        console.log(`✅ GitHub Updated 100% Successfully: ${filename}`);

        // 5. Code wapas Bot A ko bhejna
        res.status(200).json({ 
            success: true, 
            message: "Fixed, Stripped, and Pushed Perfectly!", 
            fixedCode: fixedCode 
        });

    } catch (err) {
        console.error("❌ Surgery Failed:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Surgeon Bot B is ready on port ${PORT} 🚀`));
