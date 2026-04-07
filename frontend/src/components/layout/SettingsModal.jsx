import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/auth/useAuth";
import { useAlertSettings } from "../../hooks/common/useAlertSettings";
import { resetPassword, deleteAccount } from "../../services/api";

function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("security");
  const { user, logout } = useAuth();
  const { settings, loading, saving, saveSettings } = useAlertSettings();
  const [keywordsInput, setKeywordsInput] = useState("");

  // Sync keywords input with settings when settings load
  useEffect(() => {
    setKeywordsInput(settings.keywords.join(", "));
  }, [settings.keywords]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="w-[800px] h-[500px] bg-white rounded-xl shadow-lg flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT SIDEBAR */}
        <div className="w-1/3 border-r p-4 flex flex-col justify-between h-full">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 text-left px-3 py-2 rounded ${
                activeTab === "security" ? "bg-gray-200" : "hover:bg-gray-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              Login & Security
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center gap-2 text-left px-3 py-2 rounded ${
                activeTab === "alerts" ? "bg-gray-200" : "hover:bg-gray-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
              Job Alerts
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-6 pt-4">
            <a
              href="/privacy"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
              Privacy Policy
            </a>

            <button
              onClick={async () => {
                await logout();
                toast.success("Logged out successfully");
                setTimeout(() => {
                  window.location.href = "/";
                }, 800);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-red-100 text-left text-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                />
              </svg>
              Log Out
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "security" && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold">Login & Security</h2>

              {/* Email */}
              <div>
                <p className="font-medium">Email</p>
                <p className="text-gray-600 text-sm">{user?.email}</p>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-gray-500 text-sm">
                    Reset your account password
                  </p>
                </div>

                <button
                  onClick={async () => {
                    const oldPass = prompt("Enter current password");
                    if (!oldPass) return;

                    const newPass = prompt("Enter new password");
                    if (!newPass) return;

                    const res = await resetPassword(oldPass, newPass);

                    if (res?.detail) {
                      toast.error(res.detail);
                    } else {
                      toast.success("Password updated. Please log in again.");
                      await logout();
                      window.location.href = "/login";
                    }
                  }}
                  className="px-4 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  Reset Password
                </button>
              </div>

              {/* Delete account */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="font-medium text-red-600">Delete my account</p>
                  <p className="text-gray-500 text-sm">
                    Permanently delete your account and all associated data
                  </p>
                </div>

                <button
                  onClick={async () => {
                    const confirmDelete = window.confirm(
                      "Are you sure? This cannot be undone.",
                    );
                    if (!confirmDelete) return;

                    try {
                      await deleteAccount();

                      toast.success("Account deleted successfully");

                      setTimeout(() => {
                        window.location.href = "/";
                      }, 1000);
                    } catch (err) {
                      toast.error(
                        err?.response?.data?.detail ||
                          "Failed to delete account",
                      );
                    }
                  }}
                  className="px-4 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold">Job Alerts</h2>

              {loading ? (
                <p className="text-gray-500">Loading settings...</p>
              ) : (
                <>
                  {/* Enable */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          enabled: e.target.checked,
                        };
                        saveSettings(newSettings);
                      }}
                    />
                    Enable Job Alerts
                  </label>

                  {/* CV selection */}
                  <div>
                    <p className="font-medium">CV for matching</p>
                    <select
                      className="mt-1 w-full border rounded px-2 py-1"
                      value={settings.cv_id || ""}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          cv_id: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        };
                        saveSettings(newSettings);
                      }}
                    >
                      <option value="">My Primary CV</option>
                    </select>
                  </div>

                  {/* Match threshold */}
                  <div>
                    <p className="font-medium">Match quality</p>
                    <select
                      className="mt-1 w-full border rounded px-2 py-1"
                      value={settings.match_quality_threshold}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          match_quality_threshold: parseFloat(e.target.value),
                        };
                        saveSettings(newSettings);
                      }}
                    >
                      <option value={80}>80%+ (High match)</option>
                      <option value={60}>60%+ (Recommended)</option>
                      <option value={0}>All</option>
                    </select>
                  </div>

                  {/* Frequency */}
                  <div>
                    <p className="font-medium">Notification frequency</p>
                    <select
                      className="mt-1 w-full border rounded px-2 py-1"
                      value={settings.notification_frequency}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          notification_frequency: e.target.value,
                        };
                        saveSettings(newSettings);
                      }}
                    >
                      <option value="instant">Instant</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  {/* Keywords */}
                  <div>
                    <p className="font-medium">Keywords</p>
                    <p className="text-gray-500 text-sm mb-2">
                      Comma-separated values (e.g., React, AI, Backend)
                    </p>
                    <input
                      className="mt-1 w-full border rounded px-2 py-1"
                      placeholder="React, AI, Backend..."
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      onBlur={() => {
                        const keywords = keywordsInput
                          .split(",")
                          .map((k) => k.trim())
                          .filter((k) => k);
                        const newSettings = {
                          ...settings,
                          keywords,
                        };
                        saveSettings(newSettings);
                      }}
                    />
                  </div>

                  {saving && <p className="text-blue-600 text-sm">Saving...</p>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
