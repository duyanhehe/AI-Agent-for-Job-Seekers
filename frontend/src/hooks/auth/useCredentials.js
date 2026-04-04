import { useState } from "react";

/**
 * Holds email and password field state for auth forms.
 * @returns {{ email: string, password: string, setEmail: function, setPassword: function }}
 */
export default function useCredentials() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return { email, password, setEmail, setPassword };
}
