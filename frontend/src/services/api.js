const API = "http://localhost:8000";

export async function signup(data) {
  const res = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function login(data) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json();

  return {
    ok: res.ok,
    status: res.status,
    data: json,
  };
}

export async function logout() {
  const res = await fetch(`${API}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  return res.json();
}

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
    credentials: "include",
  });

  return res.json();
}

export async function recalculateJobs(data) {
  const res = await fetch(`${API}/job/recalculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function analyzeJob(data) {
  const res = await fetch(`${API}/job/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function askQuestion(data) {
  const res = await fetch(`${API}/job/question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function getDashboard() {
  const res = await fetch(`${API}/user/dashboard`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Not authenticated");

  return res.json();
}
