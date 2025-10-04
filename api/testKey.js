export default function handler(req, res) {
  const keyPresent = !!process.env.OPENAI_API_KEY;
  res.status(200).json({ keyPresent });
}
