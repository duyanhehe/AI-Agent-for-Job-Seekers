import json
from app.core.redis import redis_client


def cache_get(key):
    data = redis_client.get(f"app:{key}")
    return json.loads(data) if data else None


def cache_set(key, value, ttl=3600):
    redis_client.setex(f"app:{key}", ttl, json.dumps(value))
