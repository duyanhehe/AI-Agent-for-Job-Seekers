"""Admin statistics service."""

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.job_applications import JobApplication
from app.models.cv_documents import CVDocuments
from app.models.job_alert_settings import JobAlertSettings
from app.models.notification import Notification


class AdminStatsService:
    """Service for retrieving system statistics."""

    @staticmethod
    def get_stats(db: Session) -> dict:
        """
        Get system statistics and usage metrics.

        Args:
            db: Database session

        Returns:
            dict: Statistics including counts of users, applications, CVs, alerts, notifications
        """
        total_users = db.query(func.count(User.id)).scalar()
        total_applications = db.query(func.count(JobApplication.id)).scalar()
        total_cvs = db.query(func.count(CVDocuments.id)).scalar()
        total_alerts = db.query(func.count(JobAlertSettings.id)).scalar()
        total_notifications = db.query(func.count(Notification.id)).scalar()

        return {
            "total_users": total_users or 0,
            "total_applications": total_applications or 0,
            "total_cvs": total_cvs or 0,
            "total_alerts": total_alerts or 0,
            "total_notifications": total_notifications or 0,
        }
