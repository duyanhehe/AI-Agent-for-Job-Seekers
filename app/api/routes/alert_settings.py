"""Job Alert Settings API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.schemas.job_alert_settings import (
    JobAlertSettingsResponse,
    UpdateJobAlertSettingsRequest,
)
from app.services.notifications.alert_settings_service import (
    get_or_create_alert_settings,
    update_alert_settings,
)

router = APIRouter(prefix="/alert-settings", tags=["job-alerts"])


@router.get("/", response_model=JobAlertSettingsResponse)
def get_alert_settings(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get job alert settings for the current user."""
    settings = get_or_create_alert_settings(db, user.id)
    return settings


@router.put("/", response_model=JobAlertSettingsResponse)
def update_alert_settings_endpoint(
    data: UpdateJobAlertSettingsRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update job alert settings for the current user."""
    settings = update_alert_settings(
        db,
        user.id,
        enabled=data.enabled,
        cv_id=data.cv_id,
        match_quality_threshold=data.match_quality_threshold,
        notification_frequency=data.notification_frequency,
        keywords=data.keywords,
    )
    return settings
