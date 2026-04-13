import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.core.dependencies import get_db, get_rate_limit_service, get_index_manager
from app.main import app
from httpx import AsyncClient, ASGITransport
import unittest.mock as mock

from app.services.llm.llm_service import LLMService


@pytest.fixture
def app():
    from app.main import app

    return app


# Use a test SQLite database
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_db.sqlite")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield

    # CLOSE ENGINE FIRST
    engine.dispose()

    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def override_get_db(db):
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    return _override_get_db


@pytest.fixture
def override_get_rate_limit_service():
    mock_rate = mock.MagicMock()
    mock_rate.check_and_consume.return_value = True
    return lambda: mock_rate


@pytest.fixture()
def app_override(
    app, override_get_db, override_get_rate_limit_service, mock_index_manager
):
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_rate_limit_service] = override_get_rate_limit_service
    app.dependency_overrides[get_index_manager] = lambda: mock_index_manager
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture(autouse=True)
def mock_redis():
    with mock.patch("app.core.redis.redis_client") as mocked_redis:
        # Mocking some common redis methods
        mocked_redis.get.return_value = None
        mocked_redis.set.return_value = True
        mocked_redis.delete.return_value = True
        yield mocked_redis


@pytest.fixture
def mock_index_manager():
    mock_manager = mock.MagicMock()
    mock_manager.build_rag_context.return_value = "Sample job context for testing."
    mock_manager.jobs_data = {
        1: {
            "job_id": 1,
            "job_role": "Python Developer",
            "job_function": "Backend",
            "company": "TechCorp",
            "location": "Remote",
            "skills": ["Python", "FastAPI"],
        }
    }
    mock_manager.matchJobs.return_value = {
        "jobs": [{"job_id": 1, "score": 0.9, "job_role": "Python Developer"}],
        "warning": None,
    }
    return mock_manager


@pytest.fixture
def llm_service(mock_index_manager):
    service = LLMService(index_manager=mock_index_manager)
    return service
