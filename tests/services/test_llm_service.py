import pytest
import json
from unittest.mock import AsyncMock, MagicMock
from app.services.llm.llm_service import LLMService


@pytest.fixture
def mock_llm_response():
    mock = MagicMock()
    mock.text = json.dumps({"answer": "Yes", "reason": "Test reason"})

    mock.usage_metadata = MagicMock()
    mock.usage_metadata.prompt_token_count = 10
    mock.usage_metadata.candidates_token_count = 20
    mock.usage_metadata.total_token_count = 30

    return mock


@pytest.mark.asyncio
async def test_call_llm_success(llm_service, mock_llm_response, db, monkeypatch):
    async_mock = AsyncMock(return_value=mock_llm_response)

    monkeypatch.setattr(llm_service.client.aio.models, "generate_content", async_mock)

    result = await llm_service._call_llm(
        prompt="test prompt", function_name="Test Function", user_id=1, db=db
    )

    assert result["answer"] == "Yes"
    assert result["reason"] == "Test reason"


@pytest.mark.asyncio
async def test_call_llm_invalid_json(llm_service, db, monkeypatch):
    mock = MagicMock()
    mock.text = "INVALID JSON"
    mock.usage_metadata = MagicMock()
    mock.usage_metadata.prompt_token_count = 1
    mock.usage_metadata.candidates_token_count = 1
    mock.usage_metadata.total_token_count = 2

    async_mock = AsyncMock(return_value=mock)

    monkeypatch.setattr(llm_service.client.aio.models, "generate_content", async_mock)

    result = await llm_service._call_llm(
        prompt="bad json", function_name="Test", user_id=1, db=db
    )

    assert result["reason"] == "invalid_format"


@pytest.mark.asyncio
async def test_call_llm_empty_response(llm_service, db, monkeypatch):
    mock = MagicMock()
    mock.text = ""
    mock.usage_metadata = MagicMock()
    mock.usage_metadata.prompt_token_count = 1
    mock.usage_metadata.candidates_token_count = 1
    mock.usage_metadata.total_token_count = 2

    async_mock = AsyncMock(return_value=mock)

    monkeypatch.setattr(llm_service.client.aio.models, "generate_content", async_mock)

    result = await llm_service._call_llm(
        prompt="empty", function_name="Test", user_id=1, db=db
    )

    assert result["reason"] == "empty_response"


@pytest.mark.asyncio
async def test_call_llm_exception(llm_service, db, monkeypatch):
    async_mock = AsyncMock(side_effect=Exception("LLM failed"))

    monkeypatch.setattr(llm_service.client.aio.models, "generate_content", async_mock)

    result = await llm_service._call_llm(
        prompt="error", function_name="Test", user_id=1, db=db
    )

    assert result["reason"] == "llm_failure"
