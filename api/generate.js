import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // This can be sk-proj-…
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Debug: Confirm the API key is read
  console.log("API key present?", !!process.env.OPENAI_API_KEY);

  const { resumeText, jobText } = req.body;

  if (!resumeText || !jobText) {
    return res.status(400).json({ error: "Missing resumeText or jobText" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // can be replaced with gpt-3.5-turbo for lower cost
      messages: [
        { role: "system", content: "You are an assistant that customizes resumes and cover letters." },
        { role: "user", content: `Resume: ${resumeText}\nJob: ${jobText}` }
      ],
      max_tokens: 500
    });

    res.status(200).json({
      tailoredResume: completion.choices[0].message.content,
      coverLetter: "Generated cover letter text here",
      changeNotes: "Notes about changes here"
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: error.message });
  }
}
