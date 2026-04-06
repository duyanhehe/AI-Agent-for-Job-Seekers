"""Notification API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.schemas.notification import NotificationResponse, CreateNotificationRequest
from app.services.notifications.notifications_service import (
    get_user_notifications,
    mark_notification_as_read,
    delete_notification,
    get_unread_count,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationResponse])
def get_notifications(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all notifications for the current user."""
    notifications = get_user_notifications(db, user.id)
    return notifications


@router.get("/unread-count")
def get_unread_notification_count(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get count of unread notifications."""
    count = get_unread_count(db, user.id)
    return {"unread_count": count}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    notification = mark_notification_as_read(db, notification_id, user.id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification


@router.delete("/{notification_id}")
def delete_notification_endpoint(
    notification_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a notification."""
    success = delete_notification(db, notification_id, user.id)

    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification deleted successfully"}
