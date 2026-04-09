import requests
import json
from app.core.config import OPENROUTER_API_KEY


class RateLimitChecker:
    """Service to check OpenRouter API rate limits and credits."""

    def __init__(self):
        self.api_key = OPENROUTER_API_KEY
        self.endpoint = "https://openrouter.ai/api/v1/key"

    async def check_credits(self):
        """
        Check remaining credits and rate limits from OpenRouter.

        Returns:
            dict: Contains usage, credits, and rate limit information
        """
        try:
            response = requests.get(
                url=self.endpoint, headers={"Authorization": f"Bearer {self.api_key}"}
            )
            response.raise_for_status()

            data = response.json()
            return {"status": "success", "data": data}
        except requests.exceptions.RequestException as e:
            return {"status": "error", "message": str(e)}

    async def get_credit_summary(self):
        """
        Get a simplified credit summary.

        Returns:
            dict: Simplified summary with remaining credits and limits
        """
        result = await self.check_credits()

        if result["status"] == "error":
            return result

        api_data = result.get("data", {}).get("data", {})

        return {
            "status": "success",
            "data": {
                "total_usage": api_data.get("usage", 0),
                "usage_daily": api_data.get("usage_daily", 0),
                "usage_weekly": api_data.get("usage_weekly", 0),
                "usage_monthly": api_data.get("usage_monthly", 0),
                "limit": api_data.get("limit"),
                "limit_remaining": api_data.get("limit_remaining"),
                "limit_reset": api_data.get("limit_reset"),
                "rate_limit_requests": api_data.get("rate_limit", {}).get(
                    "requests", -1
                ),
                "rate_limit_interval": api_data.get("rate_limit", {}).get(
                    "interval", "10s"
                ),
                "is_free_tier": api_data.get("is_free_tier", False),
                "expires_at": api_data.get("expires_at"),
            },
        }
