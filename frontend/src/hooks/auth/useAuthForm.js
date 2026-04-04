import { useState } from "react";

export default function useAuthForm(apiFn, onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(payload) {
    setLoading(true);
    setError("");

    try {
      const res = await apiFn(payload);

      if (res.message || res.ok) {
        onSuccess(res);
      } else {
        setError(res.detail || "Failed");
      }
    } catch {
      setError("Server error");
    }

    setLoading(false);
  }

  return { loading, error, handleSubmit };
}
