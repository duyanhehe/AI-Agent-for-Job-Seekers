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

export async function getMe() {
  const res = await fetch(`${API}/auth/me`, {
    credentials: "include",
  });

  return res.json();
}

export async function resetPassword(oldPassword, newPassword) {
  const formData = new FormData();
  formData.append("old_password", oldPassword);
  formData.append("new_password", newPassword);

  const res = await fetch(`${API}/auth/reset-password`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return res.json();
}

export async function deleteAccount() {
  const res = await fetch(`${API}/auth/delete-account`, {
    method: "DELETE",
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

export async function deleteCVAPI(cv_id) {
  const res = await fetch(`${API}/cv/${cv_id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return res.json();
}

export async function renameCVAPI(cv_id, newName) {
  const formData = new FormData();
  formData.append("new_name", newName);

  const res = await fetch(`${API}/cv/${cv_id}/rename`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  return res.json();
}

export async function setPrimaryCVAPI(cv_id) {
  const res = await fetch(`${API}/cv/${cv_id}/set-primary`, {
    method: "PUT",
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

export async function saveJobAction(formData) {
  const res = await fetch(`${API}/job/action`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  return res.json();
}

export async function saveExternalJob(formData) {
  const res = await fetch(`${API}/external-job`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  return res.json();
}

export async function getExternalJobs() {
  const res = await fetch(`${API}/external-job`, {
    credentials: "include",
  });

  return res.json();
}

export async function updateProfile(profile) {
  const res = await fetch(`${API}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(profile),
  });

  return res.json();
}
