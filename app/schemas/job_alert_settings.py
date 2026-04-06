from pydantic import BaseModel


class JobAlertSettingsResponse(BaseModel):
    """Schema for job alert settings response."""

    id: int
    enabled: bool
    cv_id: int | None
    match_quality_threshold: float
    notification_frequency: str
    keywords: list[str]

    class Config:
        from_attributes = True


class UpdateJobAlertSettingsRequest(BaseModel):
    """Schema for updating job alert settings."""

    enabled: bool | None = None
    cv_id: int | None = None
    match_quality_threshold: float | None = None
    notification_frequency: str | None = None
    keywords: list[str] | None = None
