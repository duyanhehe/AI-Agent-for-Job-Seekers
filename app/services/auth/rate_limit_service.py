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

    def __init__(self):
        # current date for key expiration
        self.today = datetime.now().strftime("%Y-%m-%d")

    def _get_user_key(self, user_id):
        return f"ratelimit:user:{user_id}:{self.today}"

    def _get_global_key(self):
        return f"ratelimit:global:{self.today}"

    def check_and_consume(self, user_id: int, feature_name: str, weight: int):
        """
        Atomically check and consume user credits and global capacity.
        Raises HTTPException if limits are exceeded.
        """
        user_key = self._get_user_key(user_id)
        global_key = self._get_global_key()

        # Check Global Limit
        current_global = redis_client.get(global_key)
        if current_global and int(current_global) >= self.GLOBAL_SAFETY_CAP:
            raise HTTPException(
                status_code=503,
                detail="Service is currently at maximum capacity. Please try again tomorrow.",
            )

        # Check User Credit Limit
        current_user_credits = redis_client.get(user_key)
        if (
            current_user_credits
            and int(current_user_credits) + weight > self.USER_CREDIT_LIMIT
        ):
            remaining = self.USER_CREDIT_LIMIT - int(current_user_credits)
            raise HTTPException(
                status_code=429,
                detail=f"Daily limit reached. This action costs {weight} credits, but you only have {remaining} remaining.",
            )

        # Atomic Increment (Global)
        redis_client.incr(global_key)
        redis_client.expire(global_key, 86400)  # Ensure it expires after 24h

        # Atomic Increment (User)
        redis_client.incrby(user_key, weight)
        redis_client.expire(user_key, 86400)

        # Return status
        return {
            "credit_consumed": weight,
            "remaining_credits": self.USER_CREDIT_LIMIT
            - (int(current_user_credits or 0) + weight),
        }

    def get_remaining_credits(self, user_id: int):
        user_key = self._get_user_key(user_id)
        used = redis_client.get(user_key)
        return self.USER_CREDIT_LIMIT - int(used or 0)
