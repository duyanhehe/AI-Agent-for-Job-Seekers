"""Service for managing job alert settings."""

from sqlalchemy.orm import Session
from app.models.job_alert_settings import JobAlertSettings


def get_or_create_alert_settings(db: Session, user_id: int) -> JobAlertSettings:
    """Get existing alert settings or create defaults."""
    settings = (
        db.query(JobAlertSettings).filter(JobAlertSettings.user_id == user_id).first()
    )

    if not settings:
        settings = JobAlertSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


def update_alert_settings(
    db: Session,
    user_id: int,
    enabled: bool | None = None,
    cv_id: int | None = None,
    match_quality_threshold: float | None = None,
    notification_frequency: str | None = None,
    keywords: list[str] | None = None,
) -> JobAlertSettings:
    """Update job alert settings for a user."""
    settings = get_or_create_alert_settings(db, user_id)

    if enabled is not None:
        settings.enabled = enabled
    if cv_id is not None:
        settings.cv_id = cv_id
    if match_quality_threshold is not None:
        settings.match_quality_threshold = match_quality_threshold
    if notification_frequency is not None:
        settings.notification_frequency = notification_frequency
    if keywords is not None:
        settings.keywords = keywords

    db.commit()
    db.refresh(settings)
    return settings
