const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple helper to estimate token count (rough)
function estimateTokens(str) {
  return Math.ceil(str.split(/\s+/).length * 1.33); // ~1.33 tokens per word
}

module.exports = async function handler(req, res) {
  console.log("=== API Request received ===");
  console.log("Method:", req.method);
  const startTime = Date.now();

  if (req.method !== "POST") {
    console.log("Invalid method, returning 405");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeText, jobText } = req.body || {};
  console.log("Resume length:", resumeText ? resumeText.length : 0);
  console.log("Job description length:", jobText ? jobText.length : 0);
  console.log("Estimated tokens:", estimateTokens(resumeText || "") + estimateTokens(jobText || ""));

  if (!resumeText || !jobText) {
    console.log("Missing resume or job text, returning 400");
    return res.status(400).json({ error: "resumeText and jobText are required" });
  }

  try {
    console.log("Calling OpenAI API...");
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that edits resumes and writes concise cover letters. Output only valid JSON." },
        { role: "user", content: `Resume:\n${resumeText}\n\nJob:\n${jobText}\n\nReturn JSON: {tailoredResume:"", coverLetter:"", changeNotes:""}` }
      ],
      temperature: 0.2,
      max_tokens: 500
    });

    const duration = Date.now() - startTime;
    console.log("OpenAI response received in", duration, "ms");

    let parsed = {};
    try {
      parsed = JSON.parse(response.choices[0].message.content);
    } catch {
      parsed = {
        tailoredResume: "",
        coverLetter: "",
        changeNotes: response.choices[0].message.content
      };
    }

    res.status(200).json(parsed);

  } catch (err) {
    console.error("OpenAI API error:", err);
    const duration = Date.now() - startTime;
    console.log("Request failed after", duration, "ms");
    res.status(500).json({ error: err.message });
  }
};
