import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { saveJobAction } from "../../services/api";

/**
 * Local UI state for a job card: report modal, status sync with props, report reason.
 * @param {object} job
 * @param {function|undefined} onStatusChange
 * @returns {object}
 */
export default function useJobCard(job, onStatusChange) {
  const [showReport, setShowReport] = useState(false);
  const [status, setStatus] = useState(job.status || null);
  const [selectedReason, setSelectedReason] = useState(null);

  useEffect(() => {
    setStatus(job.status || null);
  }, [job.status]);

  /**
   * Persists a status change and notifies the parent list.
   * @param {string} newStatus
   * @param {string|null} reason
   */
  const handleAction = useCallback(
    async (newStatus, reason = null) => {
      try {
        const formData = new FormData();
        formData.append("job_id", job.job_id);
        formData.append("status", newStatus);
        if (reason) formData.append("reason", reason);

        await saveJobAction(formData);

        setStatus(newStatus);

        if (onStatusChange) {
          onStatusChange(job.job_id, newStatus);
        }

        toast.success(`Saved as ${newStatus}`);
        setShowReport(false);
        setSelectedReason(null);
      } catch (err) {
        console.error(err);
        toast.error("Action failed");
      }
    },
    [job.job_id, onStatusChange],
  );

  /**
   * Closes the report modal and clears the selected reason.
   */
  const cancelReport = useCallback(() => {
    setShowReport(false);
    setSelectedReason(null);
  }, []);

  return {
    showReport,
    setShowReport,
    status,
    selectedReason,
    setSelectedReason,
    handleAction,
    cancelReport,
  };
}
