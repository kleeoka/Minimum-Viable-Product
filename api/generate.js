import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to retry on 429 (Too Many Requests)
async function callOpenAIWithRetry(params, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (err) {
      if (err.status === 429 && i < retries - 1) {
        // Wait before retrying
        console.warn(`429 received, retrying in ${delayMs}ms...`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        throw err;
      }
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeText, jobText, keepBullets } = req.body || {};

  if (!resumeText || !jobText) {
    return res.status(400).json({ error: "resumeText and jobText are required" });
  }

  try {
    const systemPrompt = "You are a helpful assistant that edits resumes and writes concise cover letters. Output only valid JSON.";
    const userPrompt = `
Resume text:
${resumeText}

Job description:
${jobText}

TASK:
1) Create a tailored resume
2) Create a 3-paragraph cover letter
3) Include change notes
Return JSON: {tailoredResume:"", coverLetter:"", changeNotes:""}
`;

    const response = await callOpenAIWithRetry({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", conte
