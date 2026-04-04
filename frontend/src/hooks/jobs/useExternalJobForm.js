import { useState, useCallback } from "react";

const initialForm = {
  title: "",
  company: "",
  location: "",
  url: "",
  description: "",
};

/**
 * Form state and change handler for the external job drawer.
 * @returns {{ form: object, handleChange: function, resetForm: function }}
 */
export default function useExternalJobForm() {
  const [form, setForm] = useState(initialForm);

  /**
   * Updates a single field on the job form.
   * @param {string} key
   * @param {string} value
   */
  const handleChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Clears all fields (e.g. after successful save).
   */
  const resetForm = useCallback(() => {
    setForm(initialForm);
  }, []);

  return { form, handleChange, resetForm };
}
