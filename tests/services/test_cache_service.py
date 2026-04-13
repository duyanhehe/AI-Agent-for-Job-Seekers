import pytest
import json
import unittest.mock as mock
from app.services.cache.cache_service import (
    cache_get,
    cache_set,
    cache_delete,
    cache_delete_pattern,
)


@pytest.fixture
def mock_redis():
    with mock.patch("app.services.cache.cache_service.redis_client") as mocked:
        yield mocked


def test_cache_miss(mock_redis):
    mock_redis.get.return_value = None
    assert cache_get("nonexistent") is None


def test_cache_hit(mock_redis):
    # Setup data
    data = {"key": "value"}
    mock_redis.get.return_value = json.dumps(data)

    result = cache_get("test_key")
    assert result == data
    mock_redis.get.assert_called_with("app:test_key")


def test_cache_set(mock_redis):
    data = {"score": 100}
    cache_set("key", data, ttl=100)

    mock_redis.setex.assert_called_with("app:key", 100, json.dumps(data))


def test_cache_delete(mock_redis):
    cache_delete("raw_key")
    mock_redis.delete.assert_called_with("raw_key")


def test_cache_delete_pattern(mock_redis):
    # Mock scan_iter to return some keys
    mock_redis.scan_iter.return_value = ["key:1", "key:2"]

    cache_delete_pattern("key:*")

    assert mock_redis.delete.call_count == 2
    mock_redis.delete.assert_has_calls([mock.call("key:1"), mock.call("key:2")])
