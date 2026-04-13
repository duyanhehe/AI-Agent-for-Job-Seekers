import pytest
from app.services.notifications.notifications_service import (
    create_notification,
    get_user_notifications,
    mark_notification_as_read,
    delete_notification,
    get_unread_count,
)
from app.models.notification import Notification


def test_notification_lifecycle(db):
    user_id = 1

    # Create
    n = create_notification(db, user_id, "Test Title", "Test Message")
    assert n.id is not None
    assert n.is_read is False

    # Get unread count
    assert get_unread_count(db, user_id) == 1

    # Mark as read
    updated = mark_notification_as_read(db, n.id, user_id)
    assert updated.is_read is True
    assert get_unread_count(db, user_id) == 0

    # Get all
    all_notifs = get_user_notifications(db, user_id)
    assert len(all_notifs) == 1

    # Delete
    success = delete_notification(db, n.id, user_id)
    assert success is True
    assert len(get_user_notifications(db, user_id)) == 0


def test_mark_read_wrong_user(db):
    user_1 = 1
    user_2 = 2
    n = create_notification(db, user_1, "T", "M")

    # Try marking as read by user 2
    updated = mark_notification_as_read(db, n.id, user_2)
    assert updated is None

    db.refresh(n)
    assert n.is_read is False


def test_get_unread_only(db):
    user_id = 1
    create_notification(db, user_id, "N1", "M1")
    n2 = create_notification(db, user_id, "N2", "M2")
    mark_notification_as_read(db, n2.id, user_id)

    unread = get_user_notifications(db, user_id, unread_only=True)
    assert len(unread) == 1
    assert unread[0].title == "N1"
