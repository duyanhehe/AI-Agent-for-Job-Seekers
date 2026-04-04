import { useEffect, useState, useCallback } from "react";
import { updateProfile } from "../../services/api";

/**
 * Syncs profile from dashboard, manages edit modal state, and persists saves.
 * @param {object|null} dashboard
 * @param {function} refreshDashboard
 * @returns {object}
 */
export default function useProfilePage(dashboard, refreshDashboard) {
  const [profile, setProfile] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!dashboard) {
      refreshDashboard();
    } else {
      const latest = dashboard.job_history?.[0];
      if (latest?.profile) setProfile(latest.profile);
    }
    // refreshDashboard omitted from deps (unstable ref from context; same as pre-refactor Profile page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard]);

  /**
   * Opens the editor for a section with optional initial data.
   * @param {string} section
   * @param {object|undefined} data
   */
  const openEdit = useCallback((section, data) => {
    setEditingSection(section);
    setFormData(data || {});
  }, []);

  /**
   * Closes the editor and clears form state.
   */
  const closeEdit = useCallback(() => {
    setEditingSection(null);
    setFormData({});
  }, []);

  /**
   * Merges form data into profile, closes the modal, and calls the API.
   */
  const handleSave = useCallback(async () => {
    let updated;

    if (editingSection === "personal") {
      updated = {
        ...profile,
        ...formData,
      };
    } else {
      updated = {
        ...profile,
        [editingSection]: formData,
      };
    }

    setProfile(updated);
    setEditingSection(null);
    setFormData({});

    await updateProfile(updated);
  }, [editingSection, formData, profile]);

  return {
    profile,
    setProfile,
    editingSection,
    formData,
    setFormData,
    openEdit,
    closeEdit,
    handleSave,
  };
}
