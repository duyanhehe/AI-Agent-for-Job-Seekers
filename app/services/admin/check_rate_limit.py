from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from app.models.llm_function_usage import LLMFunctionUsage
from app.core.database import SessionLocal


class RateLimitChecker:
    """Service to monitor Gemini API token usage from local logs."""

    def __init__(self):
        self.db = SessionLocal()

    def __del__(self):
        if hasattr(self, "db"):
            self.db.close()

    async def get_usage_for_period(self, days=None):
        """
        Aggregate token usage for a given number of days.
        If days is None, returns total lifetime usage.
        """
        query = self.db.query(
            func.sum(LLMFunctionUsage.prompt_tokens).label("prompt"),
            func.sum(LLMFunctionUsage.completion_tokens).label("completion"),
            func.sum(LLMFunctionUsage.total_tokens).label("total"),
        )

        if days is not None:
            since = datetime.now(timezone.utc) - timedelta(days=days)
            query = query.filter(LLMFunctionUsage.created_at >= since)

        result = query.first()
        return {
            "prompt": int(result.prompt or 0),
            "completion": int(result.completion or 0),
            "total": int(result.total or 0),
        }

    async def get_credit_summary(self):
        """
        Get a summary of Gemini token usage.
        Returns:
            dict: Summary with token counts for different periods
        """
        try:
            today = await self.get_usage_for_period(days=1)
            weekly = await self.get_usage_for_period(days=7)
            monthly = await self.get_usage_for_period(days=30)
            total = await self.get_usage_for_period(days=None)

            return {
                "status": "success",
                "data": {
                    "total_usage": total["total"],  # Units in tokens
                    "usage_daily": today["total"],
                    "usage_weekly": weekly["total"],
                    "usage_monthly": monthly["total"],
                    # Gemini doesn't have a dynamic credit limit API, so we set these to None or fixed placeholders
                    "limit": None,
                    "limit_remaining": None,
                    "limit_reset": None,
                    "is_free_tier": True,  # Defaulting to true for visual feedback
                    "model": "gemini-2.5-flash-lite",
                    "details": {
                        "prompt_tokens_total": total["prompt"],
                        "completion_tokens_total": total["completion"],
                    },
                },
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
