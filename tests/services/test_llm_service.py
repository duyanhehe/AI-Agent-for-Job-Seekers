import pytest
import json
from unittest.mock import AsyncMock, MagicMock
from google.api_core import exceptions
from fastapi import HTTPException
import httpx
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


@pytest.mark.asyncio
async def test_call_llm_resource_exhausted_fallback(
    llm_service, mock_llm_response, db, monkeypatch
):
    # First call (Flash) raises ResourceExhausted, second call (Flash-Lite) succeeds
    async_mock = AsyncMock(
        side_effect=[exceptions.ResourceExhausted("Quota hit"), mock_llm_response]
    )

    monkeypatch.setattr(llm_service.client.aio.models, "generate_content", async_mock)

    result = await llm_service._call_llm(
        prompt="test", function_name="Test", user_id=1, db=db
    )

    assert result["answer"] == "Yes"
    # Verify it was called twice
    assert async_mock.call_count == 2
    # First call was Flash, second was Flash-Lite
    assert async_mock.call_args_list[0].kwargs["model"] == "gemini-2.5-flash"
    assert async_mock.call_args_list[1].kwargs["model"] == "gemini-2.5-flash-lite"


@pytest.mark.asyncio
async def test_call_llm_resource_exhausted_both_fail(llm_service, db, monkeypatch):
    # Both Gemini calls raise ResourceExhausted, then Ollama succeeds
    async_mock = AsyncMock(side_effect=exceptions.ResourceExhausted("Quota hit"))
    ollama_mock = AsyncMock(
        return_value=json.dumps({"answer": "Ollama answer", "reason": "Local model"})
    )

    monkeypatch.setattr(llm_service.client.aio.models, "generate_content", async_mock)
    monkeypatch.setattr(llm_service, "_call_ollama", ollama_mock)

    result = await llm_service._call_llm(
        prompt="test", function_name="Test", user_id=1, db=db
    )

    assert result["answer"] == "Ollama answer"
    assert result["reason"] == "Local model"
    assert async_mock.call_count == 2
    ollama_mock.assert_awaited_once_with("test")


@pytest.mark.asyncio
async def test_call_llm_resource_exhausted_ollama_unavailable(
    llm_service, db, monkeypatch
):
    async_mock = AsyncMock(side_effect=exceptions.ResourceExhausted("Quota hit"))
    ollama_mock = AsyncMock(return_value=None)

    monkeypatch.setattr(llm_service.client.aio.models, "generate_content", async_mock)
    monkeypatch.setattr(llm_service, "_call_ollama", ollama_mock)

    result = await llm_service._call_llm(
        prompt="test", function_name="Test", user_id=1, db=db
    )

    assert result["reason"] == "ollama_unavailable"
    assert async_mock.call_count == 2
    ollama_mock.assert_awaited_once_with("test")


@pytest.mark.asyncio
async def test_call_ollama_request_error(llm_service, monkeypatch):
    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, traceback):
            pass

        async def post(self, *args, **kwargs):
            raise httpx.RequestError("Ollama offline")

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    result = await llm_service._call_ollama("test")

    assert result is None


@pytest.mark.asyncio
async def test_call_llm_service_unavailable(llm_service, db, monkeypatch):
    # Raises ServiceUnavailable
    async_mock = AsyncMock(side_effect=exceptions.ServiceUnavailable("Overloaded"))

    monkeypatch.setattr(llm_service.client.aio.models, "generate_content", async_mock)

    with pytest.raises(HTTPException) as exc:
        await llm_service._call_llm(
            prompt="test", function_name="Test", user_id=1, db=db
        )

    assert exc.value.status_code == 503
    assert "temporarily overloaded" in exc.value.detail


@pytest.mark.asyncio
async def test_improve_cv(llm_service, db, monkeypatch):
    mock = MagicMock()
    mock.text = json.dumps({"updated_cv": "Updated CV Text with Python and React."})
    mock.usage_metadata = MagicMock()
    mock.usage_metadata.prompt_token_count = 10
    mock.usage_metadata.candidates_token_count = 20
    mock.usage_metadata.total_token_count = 30

    async_mock = AsyncMock(return_value=mock)
    monkeypatch.setattr(llm_service.client.aio.models, "generate_content", async_mock)

    result = await llm_service.improve_cv(
        cv_text="Original CV", missing_skills="Python, React", user_id=1, db=db
    )

    assert result["updated_cv"] == "Updated CV Text with Python and React."
