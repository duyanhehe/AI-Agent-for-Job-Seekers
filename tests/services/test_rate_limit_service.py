import pytest
import unittest.mock as mock
from fastapi import HTTPException
from app.services.auth.rate_limit_service import RateLimitService


@pytest.fixture
def rate_limit_mocks():
    with mock.patch("app.services.auth.rate_limit_service.redis_client") as mock_redis:
        mock_script = mock.MagicMock()
        mock_redis.register_script.return_value = mock_script
        service = RateLimitService()
        yield service, mock_script, mock_redis


def test_check_and_consume_success(rate_limit_mocks):
    service, mock_script, _ = rate_limit_mocks

    mock_script.return_value = [0, 5]

    result = service.check_and_consume(user_id=1, feature_name="test", weight=1)

    assert result["credit_consumed"] == 1
    assert result["remaining_credits"] == service.USER_CREDIT_LIMIT - 5


def test_check_and_consume_global_limit(rate_limit_mocks):
    service, mock_script, _ = rate_limit_mocks

    mock_script.return_value = [1, 950]

    with pytest.raises(HTTPException) as excinfo:
        service.check_and_consume(user_id=1, feature_name="test", weight=1)

    assert excinfo.value.status_code == 503


def test_check_and_consume_user_limit(rate_limit_mocks):
    service, mock_script, _ = rate_limit_mocks

    mock_script.return_value = [2, 25]

    with pytest.raises(HTTPException) as excinfo:
        service.check_and_consume(user_id=1, feature_name="test", weight=1)

    assert excinfo.value.status_code == 429


def test_get_remaining_credits(rate_limit_mocks):
    service, _, mock_redis = rate_limit_mocks

    mock_redis.get.return_value = "10"

    remaining = service.get_remaining_credits(user_id=1)
    assert remaining == service.USER_CREDIT_LIMIT - 10
