"""Service for managing user notifications."""

from sqlalchemy.orm import Session
from app.models.notification import Notification


def get_user_notifications(
    db: Session,
    user_id: int,
    unread_only: bool = False,
) -> list[Notification]:
    """Get notifications for a user, optionally filtered to unread only."""
    query = db.query(Notification).filter(Notification.user_id == user_id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    return query.order_by(Notification.created_at.desc()).all()


def mark_notification_as_read(
    db: Session,
    notification_id: int,
    user_id: int,
) -> Notification | None:
    """Mark a specific notification as read."""
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .first()
    )

    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)

    return notification


def delete_notification(
    db: Session,
    notification_id: int,
    user_id: int,
) -> bool:
    """Delete a notification if it belongs to the user."""
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .first()
    )

    if notification:
        db.delete(notification)
        db.commit()
        return True

    return False


def get_unread_count(db: Session, user_id: int) -> int:
    """Get count of unread notifications for a user."""
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        .count()
    )
