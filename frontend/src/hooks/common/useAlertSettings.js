import { useState, useEffect, useRef } from "react";
import { getAlertSettings, updateAlertSettings } from "../../services/api";

export function useAlertSettings() {
  const [settings, setSettings] = useState({
    id: null,
    enabled: true,
    cv_id: null,
    match_quality_threshold: 80,
    notification_frequency: "instant",
    keywords: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceTimerRef = useRef(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getAlertSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load alert settings:", error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings) => {
    setSaving(true);
    try {
      const data = await updateAlertSettings(updatedSettings);
      setSettings(data);
      return true;
    } catch (error) {
      console.error("Failed to save alert settings:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Debounced version - waits 800ms after last call before saving
  const debouncedSaveSettings = (updatedSettings, delay = 800) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Update local state immediately for UI responsiveness
    setSettings(updatedSettings);

    // Set new timer for backend save
    debounceTimerRef.current = setTimeout(() => {
      saveSettings(updatedSettings);
    }, delay);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    settings,
    loading,
    saving,
    saveSettings,
    debouncedSaveSettings,
    setSettings,
  };
}
