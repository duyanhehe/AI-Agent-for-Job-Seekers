import axios from "axios";

const API = "/api";

// Axios instance
const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// ================= AUTH =================

export async function signup(data) {
  try {
    const res = await api.post("/auth/signup", data);
    return {
      ok: true,
      status: res.status,
      data: res.data,
    };
  } catch (err) {
    return {
      ok: false,
      status: err.response?.status,
      data: err.response?.data,
    };
  }
}

export async function login(data) {
  try {
    const res = await api.post("/auth/login", data);
    return {
      ok: true,
      status: res.status,
      data: res.data,
    };
  } catch (err) {
    return {
      ok: false,
      status: err.response?.status,
      data: err.response?.data,
    };
  }
}

export async function logout() {
  const res = await api.post("/auth/logout");
  return res.data;
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

export async function resetPassword(oldPassword, newPassword) {
  const formData = new FormData();
  formData.append("old_password", oldPassword);
  formData.append("new_password", newPassword);

  const res = await api.post("/auth/reset-password", formData);
  return res.data;
}

export async function deleteAccount() {
  const res = await api.delete("/auth/delete-account");
  return res.data;
}

export async function getCredits() {
  const res = await api.get("/auth/credits");
  return res.data;
}

// ================= DATA =================

export async function getJobFunctions() {
  const res = await api.get("/job-functions");
  return res.data;
}

export async function getCountries() {
  const res = await api.get("/countries");
  return res.data;
}

// ================= CV =================

export async function uploadCV(formData) {
  const res = await api.post("/upload/cv", formData);
  return res.data;
}

export async function deleteCVAPI(cv_id) {
  const res = await api.delete(`/cv/${cv_id}`);
  return res.data;
}

export async function renameCVAPI(cv_id, newName) {
  const formData = new FormData();
  formData.append("new_name", newName);

  const res = await api.put(`/cv/${cv_id}/rename`, formData);
  return res.data;
}

export async function setPrimaryCVAPI(cv_id) {
  const res = await api.put(`/cv/${cv_id}/set-primary`);
  return res.data;
}

export async function previewCVBuild(data) {
  const res = await api.post("/cv/builder/preview", data);
  return res.data;
}

export async function saveCVBuild(data) {
  const res = await api.post("/cv/builder/save", data);
  return res.data;
}

// ================= JOB =================

export async function recalculateJobs(data) {
  const res = await api.post("/job/recalculate", data);
  return res.data;
}

export async function analyzeJob(data) {
  const res = await api.post("/job/analyze", data);
  return res.data;
}

export async function askQuestion(data) {
  const res = await api.post("/job/question", data);
  return res.data;
}

// ================= DASHBOARD =================

export async function getDashboard() {
  try {
    const res = await api.get("/user/dashboard");
    return res.data;
  } catch (err) {
    throw new Error("Not authenticated");
  }
}

// ================= JOB ACTIONS =================

export async function saveJobAction(formData) {
  const res = await api.post("/job/action", formData);
  return res.data;
}

// ================= EXTERNAL JOB =================

export async function saveExternalJob(formData) {
  const res = await api.post("/external-jobs", formData);
  return res.data;
}

export async function getExternalJobs() {
  const res = await api.get("/external-jobs");
  return res.data;
}

// ================= PROFILE =================

export async function updateProfile(profile) {
  const res = await api.put("/profile", profile);
  return res.data;
}

// ================= DOWNLOAD =================

export const downloadProfile = async () => {
  const res = await api.get("/profile/export/docx", {
    responseType: "blob", // VERY IMPORTANT
  });

  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "resume.docx";
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};

// ================= INTERVIEW =================

export async function generateInterview(data) {
  const res = await api.post("/job/interview", data);
  return res.data;
}

export async function gradeInterview(data) {
  const res = await api.post("/job/interview/grade", data);
  return res.data;
}

// ================= APPLICATIONS =================

export async function getApplicationProfile(cvId) {
  try {
    const res = await api.get(`/applications/profile/${cvId}`);
    return res.data;
  } catch (error) {
    console.error("[ERROR API] getApplicationProfile failed:", error);
    throw error;
  }
}

export async function prepareApplication(data) {
  try {
    const res = await api.post("/applications/prepare", data);
    return res.data;
  } catch (error) {
    console.error("[ERROR API] prepareApplication failed:", error);
    throw error;
  }
}

export async function saveApplication(data) {
  try {
    const res = await api.post("/applications/", data);
    return res.data;
  } catch (error) {
    console.error("[ERROR API] saveApplication failed:", error);
    throw error;
  }
}

export async function getApplicationHistory() {
  const res = await api.get("/applications/history");
  return res.data;
}

// ================= NOTIFICATIONS =================

export async function fetchNotifications() {
  const res = await api.get("/notifications");
  return res.data;
}

export async function markNotificationAsRead(notificationId) {
  const res = await api.put(`/notifications/${notificationId}/read`);
  return res.data;
}

export async function deleteNotificationAPI(notificationId) {
  const res = await api.delete(`/notifications/${notificationId}`);
  return res.data;
}

// ================= JOB ALERT SETTINGS =================

export async function getAlertSettings() {
  const res = await api.get("/alert-settings");
  return res.data;
}

export async function updateAlertSettings(settings) {
  const res = await api.put("/alert-settings", settings);
  return res.data;
}

// ================= ADMIN =================

export async function getAdminStats() {
  const res = await api.get("/admin/stats");
  return res.data;
}

export async function getAdminUsers(skip = 0, limit = 100) {
  const res = await api.get(`/admin/users?skip=${skip}&limit=${limit}`);
  return res.data;
}

export async function getAdminUsage(sortBy = "most_used") {
  const res = await api.get(`/admin/usage?sort_by=${sortBy}`);
  return res.data;
}
