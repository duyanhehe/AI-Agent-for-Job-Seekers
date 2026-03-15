const API = "http://localhost:8000";

export async function getJobFunctions() {
  const res = await fetch(`${API}/job-functions`);
  return res.json();
}

export async function getCountries() {
  const res = await fetch(`${API}/countries`);
  return res.json();
}

export async function uploadCV(formData) {
  const res = await fetch(`${API}/upload/cv`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

export async function analyzeJob(data) {
  const res = await fetch(`${API}/job/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function askQuestion(data) {
  const res = await fetch(`${API}/job/question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}
