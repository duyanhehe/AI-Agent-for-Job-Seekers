"""Admin usage service."""

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.job_applications import JobApplication


class AdminUsageService:
    """Service for retrieving system usage metrics."""

    @staticmethod
    def get_application_usage(db: Session) -> dict:
        """
        Get application usage metrics.

        Args:
            db: Database session

        Returns:
            dict: Application breakdown by status
        """
        total_applications = db.query(func.count(JobApplication.id)).scalar()
        submitted_applications = (
            db.query(func.count(JobApplication.id))
            .filter(JobApplication.status == "submitted")
            .scalar()
        )

        draft_applications = (
            db.query(func.count(JobApplication.id))
            .filter(JobApplication.status == "draft")
            .scalar()
        )

        return {
            "total": total_applications or 0,
            "submitted": submitted_applications or 0,
            "draft": draft_applications or 0,
        }
