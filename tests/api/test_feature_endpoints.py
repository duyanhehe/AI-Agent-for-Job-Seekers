import pytest
import unittest.mock as mock
from httpx import AsyncClient
from app.services.auth.auth_service import AuthService
from app.models.cv_documents import CVDocuments
from app.models.user_profiles import UserProfile
from app.models.job_actions import JobAction
from app.core.dependencies import get_llm_service, get_reader


@pytest.fixture
async def auth_session(db, mock_redis):
    """Fixture to create a user and prepare mocks for their session."""
    service = AuthService()
    user = service.create_user(db, "feature_test@example.com", "password123")

    # Patch get_user_from_session for all tests using this fixture
    with mock.patch(
        "app.core.dependencies.auth_service.get_user_from_session"
    ) as mocked_get:
        mocked_get.return_value = str(user.id)
        yield user


@pytest.fixture
def mock_llm_service():
    mock_service = mock.AsyncMock()
    mock_service.extract_profile.return_value = {
        "name": "Test User",
        "email": "test@example.com",
        "skills": ["Python", "FastAPI"],
        "experience": [],
    }
    mock_service.match_cv_to_job.return_value = {"score": 0.8, "reason": "Good match"}
    return mock_service


@pytest.mark.asyncio
async def test_cv_management(client: AsyncClient, db, app_override, auth_session):
    user = auth_session

    # Create a CV record
    cv = CVDocuments(
        user_id=user.id,
        file_name="old_name.pdf",
        file_path="/tmp/old.pdf",
        content="CV content",
        is_primary=True,
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    cv_id = cv.id

    # Rename CV
    response = await client.put(
        f"/api/cv/{cv_id}/rename",
        data={"new_name": "new_name.pdf"},
        cookies={"session_id": "test"},
    )
    assert response.status_code == 200
    assert response.json()["file_name"] == "new_name.pdf"

    # Set Primary
    cv2 = CVDocuments(
        user_id=user.id,
        file_name="cv2.pdf",
        file_path="/tmp/cv2.pdf",
        content="cv2 content",
        is_primary=False,
    )
    db.add(cv2)
    db.commit()

    response = await client.put(
        f"/api/cv/{cv2.id}/set-primary", cookies={"session_id": "test"}
    )
    assert response.status_code == 200
    db.refresh(cv)
    db.refresh(cv2)
    assert cv.is_primary == False
    assert cv2.is_primary == True

    # Delete CV
    response = await client.delete(f"/api/cv/{cv_id}", cookies={"session_id": "test"})
    assert response.status_code == 200
    assert db.query(CVDocuments).filter(CVDocuments.id == cv_id).first() is None


@pytest.mark.asyncio
async def test_profile_upsert(client: AsyncClient, db, app_override, auth_session):
    user = auth_session

    # Need a primary CV
    cv = CVDocuments(
        user_id=user.id,
        file_name="primary.pdf",
        file_path="/tmp/primary.pdf",
        content="content",
        is_primary=True,
    )
    db.add(cv)
    db.commit()

    profile_data = {"name": "Updated Name", "skills": ["Cloud"]}
    response = await client.put(
        "/api/profile", json=profile_data, cookies={"session_id": "test"}
    )

    assert response.status_code == 200
    assert response.json()["profile"] == profile_data

    # Verify persistence
    db_profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    assert db_profile.profile == profile_data


@pytest.mark.asyncio
async def test_job_action_save(client: AsyncClient, db, app_override, auth_session):
    user = auth_session

    response = await client.post(
        "/api/job/action",
        data={"job_id": 99, "status": "applied", "reason": "Applied via app"},
        cookies={"session_id": "test"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "saved"

    # Verify in DB
    action = (
        db.query(JobAction)
        .filter(JobAction.user_id == user.id, JobAction.job_id == 99)
        .first()
    )
    assert action is not None
    assert action.status == "applied"


@pytest.mark.asyncio
async def test_cv_upload_flow(
    client: AsyncClient, db, app, app_override, auth_session, mock_llm_service
):
    # Override LLM service and Reader for this test
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    mock_reader = mock.MagicMock()
    mock_reader.read.return_value = "Mocked CV text content"
    app.dependency_overrides[get_reader] = lambda: mock_reader

    user = auth_session

    files = {"file": ("test_cv.pdf", b"dummy content", "application/pdf")}
    form_data = {
        "job_function": "Engineering",
        "job_type": "Full-time",
        "location": "Remote",
    }

    response = await client.post(
        "/api/upload/cv", data=form_data, files=files, cookies={"session_id": "test"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "cv_id" in data
    assert data["file_name"] == "test_cv.pdf"
    assert data["cv_text"] == "Mocked CV text content"
    assert "jobs" in data

    # Clean up overrides
    app.dependency_overrides.pop(get_llm_service)
    app.dependency_overrides.pop(get_reader)


@pytest.mark.asyncio
async def test_cv_not_found(client: AsyncClient, app_override, auth_session):
    response = await client.delete("/api/cv/99999", cookies={"session_id": "test"})
    assert response.status_code == 404
    assert response.json()["detail"] == "CV not found"
