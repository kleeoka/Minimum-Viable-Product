// app.js - client side
const resumeFile = document.getElementById('resumeFile');
const resumeText = document.getElementById('resumeText');
const jobText = document.getElementById('jobText');
const generateBtn = document.getElementById('generateBtn');
const status = document.getElementById('status');
const tailoredResumeEl = document.getElementById('tailoredResume');
const coverLetterEl = document.getElementById('coverLetter');
const changeNotesEl = document.getElementById('changeNotes');
const includeBullets = document.getElementById('includeBullets');

resumeFile.addEventListener('change', async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  if (f.type !== 'text/plain') {
    alert('Please upload a plain .txt resume for this simple demo. (PDF support can be added later.)');
    return;
  }
  const txt = await f.text();
  resumeText.value = txt;
});

generateBtn.addEventListener('click', async () => {
  const resume = resumeText.value.trim();
  const job = jobText.value.trim();
  if (!resume || !job) {
    alert('Please provide both your resume text and the job description.');
    return;
  }

  generateBtn.disabled = true;
  status.classList.remove('hidden');
  status.textContent = 'Working... talking to AI (this may take a few seconds)...';

  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: resume,
        jobText: job,
        keepBullets: includeBullets.checked
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(()=>null);
      throw new Error(err?.error || 'Server error');
    }

    const data = await resp.json();
    tailoredResumeEl.textContent = data.tailoredResume || 'No resume returned.';
    coverLetterEl.textContent = data.coverLetter || 'No cover letter returned.';
    changeNotesEl.textContent = data.changeNotes || 'No notes returned.';
    status.textContent = 'Done. See results below.';
  } catch (e) {
    console.error(e);
    status.textContent = 'Error: ' + (e.message || 'unknown');
    alert('Error: ' + (e.message || 'unknown'));
  } finally {
    generateBtn.disabled = false;
  }
});
