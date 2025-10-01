// api/generate.js  (Node.js serverless function for Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { resumeText, jobText, keepBullets } = req.body || {};
    if (!resumeText || !jobText) {
      res.status(400).json({ error: 'resumeText and jobText are required in body' });
      return;
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      res.status(500).json({ error: 'OpenAI API key not configured on server' });
      return;
    }

    // Build a clear prompt. We ask the model to return JSON with 3 fields.
    const systemPrompt = `You are a helpful assistant that edits resumes and writes concise cover letters. Output only valid JSON.`;

    const userPrompt = `
Here is the user's resume text:

${resumeText}

Here is the job description / requirements:

${jobText}

TASKS:
1) Produce a tailored resume text that keeps the user's original experiences but re-phrases and highlights the points that match the job description. Keep the resume professional and keep bullet formatting if user asked for it.
2) Produce a short cover letter (3 short paragraphs) that explains why the person is a good fit for the job.
3) Produce short changeNotes that list what you changed or added (skills, keywords, phrases).

OUTPUT FORMAT:
Return a single JSON object EXACTLY like this:
{
  "tailoredResume": "...",
  "coverLetter": "...",
  "changeNotes": "..."
}

Do not include any other text. Make the JSON parseable.
`;

    // Call OpenAI Chat Completions
    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',   // simple default model for MVP
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1200,
        temperature: 0.2
      })
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      return res.status(500).json({ error: 'OpenAI error: ' + errText });
    }

    const aiData = await openaiResp.json();
    const aiText = aiData?.choices?.[0]?.message?.content || '';

    // AI should return JSON. Try to parse.
    let parsed = {};
    try {
      parsed = JSON.parse(aiText);
    } catch (e) {
      // If parse fails, try to extract a JSON substring.
      const jsonMatch = aiText.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); }
        catch (ee) { /* fall through */ }
      }
    }

    // If still empty, put raw text into changeNotes
    if (!parsed || Object.keys(parsed).length === 0) {
      return res.status(200).json({
        tailoredResume: '',
        coverLetter: '',
        changeNotes: 'AI returned unexpected format. Raw output:\n\n' + aiText
      });
    }

    // Success
    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'server error' });
  }
}
