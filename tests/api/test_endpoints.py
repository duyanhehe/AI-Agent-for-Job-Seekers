import pytest
import unittest.mock as mock
from httpx import AsyncClient
from app.services.auth.auth_service import AuthService
from app.models.user import User


@pytest.mark.asyncio
async def test_signup_validation_missing_fields(client: AsyncClient, app_override):
    """Test 422: Request validation fails when missing fields."""
    response = await client.post("/api/auth/signup", json={"email": "test@example.com"})
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_signup_validation_invalid_password(client: AsyncClient, app_override):
    """Test 422: Request validation fails for invalid password length."""
    response = await client.post(
        "/api/auth/signup", json={"email": "test@example.com", "password": "short"}
    )
    assert response.status_code == 422
    assert "Password must be at least 8 characters" in response.text


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient, db, app_override):
    """Test 200/201: Successful user registration."""
    response = await client.post(
        "/api/auth/signup",
        json={"email": "new_user@example.com", "password": "secure_password123"},
    )
    assert response.status_code == 200
    assert response.json() == {"message": "User created"}


@pytest.mark.asyncio
async def test_login_unauthorized(client: AsyncClient, app_override):
    """Test 401: Unauthorized for invalid credentials."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrong_password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_protected_route_not_logged_in(client: AsyncClient, app_override):
    """Test 401: Protected route access without session cookie."""
    response = await client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not logged in"


@pytest.mark.asyncio
async def test_auth_protection_and_response_structure_me(
    client: AsyncClient, db, app_override
):
    """Test 200 and Response Structure: Accessing /api/auth/me after login."""
    # Create a user
    service = AuthService()
    user = service.create_user(db, "me@example.com", "password123")

    # Mock auth_service.get_user_from_session to return this user's ID
    # We patch it in app.core.dependencies
    with mock.patch(
        "app.core.dependencies.auth_service.get_user_from_session"
    ) as mocked_get_user:
        mocked_get_user.return_value = str(user.id)

        # Request /api/auth/me with a session cookie
        response = await client.get(
            "/api/auth/me", cookies={"session_id": "test-session-id"}
        )

        assert response.status_code == 200
        data = response.json()

        # Verify Response Structure
        assert "id" in data
        assert "email" in data
        assert "role" in data
        assert data["email"] == "me@example.com"
        assert data["id"] == user.id


@pytest.mark.asyncio
async def test_admin_route_forbidden_for_user(client: AsyncClient, db, app_override):
    """Test 403: Regular user forbidden from admin endpoints."""
    # Create a regular user
    service = AuthService()
    user = service.create_user(db, "regular@example.com", "password123")

    # Mock auth_service
    with mock.patch(
        "app.core.dependencies.auth_service.get_user_from_session"
    ) as mocked_get_user:
        mocked_get_user.return_value = str(user.id)

        # Request admin route
        response = await client.get(
            "/api/admin/stats", cookies={"session_id": "test-session-id"}
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Admin only"


@pytest.mark.asyncio
async def test_admin_route_success_for_admin(client: AsyncClient, db, app_override):
    """Test 200: Admin user can access admin endpoints."""
    # Create an admin user
    service = AuthService()
    user = service.create_user(db, "admin@example.com", "password123")
    user.role = "admin"
    db.add(user)
    db.commit()

    # Mock auth_service
    with mock.patch(
        "app.core.dependencies.auth_service.get_user_from_session"
    ) as mocked_get_user:
        mocked_get_user.return_value = str(user.id)

        # Request admin route
        response = await client.get(
            "/api/admin/stats", cookies={"session_id": "test-session-id"}
        )

        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert "data" in response.json()
