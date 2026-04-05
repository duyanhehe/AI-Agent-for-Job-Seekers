import json
from app.core.redis import redis_client


def cache_get(key):
    """Load JSON value for ``key`` from the app cache namespace, or None."""
    data = redis_client.get(f"app:{key}")
    return json.loads(data) if data else None


def cache_set(key, value, ttl=3600):
    """Store a JSON-serializable value with TTL seconds."""
    redis_client.setex(f"app:{key}", ttl, json.dumps(value))


def cache_delete(key: str):
    """Delete a single Redis key (raw key, no app prefix)."""
    redis_client.delete(key)


def cache_delete_pattern(pattern: str):
    """Delete all Redis keys matching ``pattern``."""
    for key in redis_client.scan_iter(pattern):
        redis_client.delete(key)
