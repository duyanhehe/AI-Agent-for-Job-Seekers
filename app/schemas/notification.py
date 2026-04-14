"""Schemas for notification endpoints."""

from pydantic import BaseModel
from datetime import datetime


class NotificationResponse(BaseModel):
    """Schema for notification response."""

    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
    notification_type: str | None = None

    class Config:
        from_attributes = True
