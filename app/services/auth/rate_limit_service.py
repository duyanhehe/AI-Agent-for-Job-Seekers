import time
from datetime import datetime
from fastapi import HTTPException
from app.core.redis import redis_client


class RateLimitService:
    """
    Manages user credit consumption and global safety caps using Redis.
    """

    USER_CREDIT_LIMIT = 25
    GLOBAL_SAFETY_CAP = 950

    # Atomic Lua Script for Check-and-Consume
    LUA_CHECK_AND_CONSUME = """
    local user_key = KEYS[1]
    local global_key = KEYS[2]
    local weight = tonumber(ARGV[1])
    local user_limit = tonumber(ARGV[2])
    local global_limit = tonumber(ARGV[3])
    local expire_time = tonumber(ARGV[4])

    -- 1. Check Global Limit
    local current_global = tonumber(redis.call('GET', global_key) or "0")
    if current_global >= global_limit then
        return {1, current_global} -- Code 1: Global Limit Reached
    end

    -- 2. Check User Limit
    local current_user = tonumber(redis.call('GET', user_key) or "0")
    if current_user + weight > user_limit then
        return {2, current_user} -- Code 2: User Limit Reached
    end

    -- 3. Perform Increments
    local new_global = redis.call('INCR', global_key)
    if tonumber(new_global) == 1 then
        redis.call('EXPIRE', global_key, expire_time)
    end

    local new_user = redis.call('INCRBY', user_key, weight)
    if tonumber(new_user) == weight then
        redis.call('EXPIRE', user_key, expire_time)
    end

    return {0, new_user} -- Code 0: Success
    """

    def __init__(self):
        # current date for key expiration
        self.today = datetime.now().strftime("%Y-%m-%d")
        # Register the script
        self.script = redis_client.register_script(self.LUA_CHECK_AND_CONSUME)

    def _get_user_key(self, user_id):
        return f"ratelimit:user:{user_id}:{self.today}"

    def _get_global_key(self):
        return f"ratelimit:global:{self.today}"

    def check_and_consume(self, user_id: int, feature_name: str, weight: int):
        """
        Atomically check and consume user credits and global capacity using Lua.
        Raises HTTPException if limits are exceeded.
        """
        user_key = self._get_user_key(user_id)
        global_key = self._get_global_key()

        # Execute atomic script
        # Args: user_key, global_key | weight, user_limit, global_limit, expire_time
        result = self.script(
            keys=[user_key, global_key],
            args=[weight, self.USER_CREDIT_LIMIT, self.GLOBAL_SAFETY_CAP, 86400],
        )

        status_code = result[0]
        current_val = result[1]

        if status_code == 1:
            raise HTTPException(
                status_code=503,
                detail="Service is currently at maximum capacity. Please try again tomorrow.",
            )
        elif status_code == 2:
            remaining = self.USER_CREDIT_LIMIT - current_val
            raise HTTPException(
                status_code=429,
                detail=f"Daily limit reached. This action costs {weight} credits, but you only have {remaining} remaining.",
            )

        # Success - status_code 0
        new_user_credits = current_val

        return {
            "credit_consumed": weight,
            "remaining_credits": self.USER_CREDIT_LIMIT - new_user_credits,
        }

    def get_remaining_credits(self, user_id: int):
        user_key = self._get_user_key(user_id)
        used = redis_client.get(user_key)
        return self.USER_CREDIT_LIMIT - int(used or 0)
