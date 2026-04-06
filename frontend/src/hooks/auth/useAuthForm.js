import { useState } from "react";

export default function useAuthForm(apiFn, onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(payload) {
    setLoading(true);
    setError("");

    // Frontend validation
    if (!payload.email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      setError("Invalid email format");
      setLoading(false);
      return;
    }

    if (!payload.password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (payload.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await apiFn(payload);

      if (res.ok || res.message) {
        onSuccess(res);
      } else {
        setError(res.data?.detail || "Failed");
      }
    } catch {
      setError("Server error");
    }

    setLoading(false);
  }

  return { loading, error, handleSubmit };
}
