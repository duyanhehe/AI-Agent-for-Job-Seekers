import pytest
from app.services.auth.auth_service import AuthService
from app.models.user import User


def test_hash_and_verify_password():
    service = AuthService()

    password = "secure123"
    hashed = service.hash_password(password)

    assert hashed != password
    assert service.verify_password(password, hashed) is True
    assert service.verify_password("wrong", hashed) is False


def test_create_user_success(db):
    service = AuthService()

    user = service.create_user(db, "test@example.com", "password123")

    assert user is not None
    assert user.email == "test@example.com"


def test_create_user_duplicate_email(db):
    service = AuthService()

    service.create_user(db, "test@example.com", "password123")
    user = service.create_user(db, "test@example.com", "password123")

    assert user is None


def test_authenticate_user_success(db):
    service = AuthService()

    service.create_user(db, "test@example.com", "password123")
    user = service.authenticate_user(db, "test@example.com", "password123")

    assert user is not None


def test_authenticate_user_wrong_password(db):
    service = AuthService()

    service.create_user(db, "test@example.com", "password123")
    user = service.authenticate_user(db, "test@example.com", "wrong")

    assert user is None


def test_session_lifecycle():
    service = AuthService()

    session_id = service.create_session(user_id=1)

    assert session_id is not None

    user_id = service.get_user_from_session(session_id)
    assert user_id is not None

    service.delete_session(session_id)
