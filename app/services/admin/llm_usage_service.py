from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.llm_function_usage import LLMFunctionUsage


class AdminLLMUsageService:
    """Service to analyze LLM function usage statistics."""

    @staticmethod
    def get_function_usage(db: Session, sort_by: str = "most_used"):
        """
        Get LLM function usage statistics with sorting options.

        Args:
            db: Database session
            sort_by: Sorting option
                - "most_used": Functions used most frequently
                - "least_used": Functions used least frequently
                - "most_credits": Functions consuming most credits
                - "least_credits": Functions consuming least credits

        Returns:
            List of dicts with:
            - function_name: str
            - count: int (number of times called)
            - total_credits: int (total credits spent)
            - average_credits: float (average credits per call)
        """

        # Group by function_name and aggregate
        stats = db.query(
            LLMFunctionUsage.function_name,
            func.count(LLMFunctionUsage.id).label("count"),
            func.sum(LLMFunctionUsage.credits_spent).label("total_credits"),
            func.avg(LLMFunctionUsage.credits_spent).label("average_credits"),
        ).group_by(LLMFunctionUsage.function_name)

        # Apply sorting
        if sort_by == "most_used":
            stats = stats.order_by(func.count(LLMFunctionUsage.id).desc())
        elif sort_by == "least_used":
            stats = stats.order_by(func.count(LLMFunctionUsage.id).asc())
        elif sort_by == "most_credits":
            stats = stats.order_by(func.sum(LLMFunctionUsage.credits_spent).desc())
        elif sort_by == "least_credits":
            stats = stats.order_by(func.sum(LLMFunctionUsage.credits_spent).asc())
        else:
            stats = stats.order_by(func.count(LLMFunctionUsage.id).desc())

        results = stats.all()

        # Format results
        formatted_results = [
            {
                "function_name": row[0],
                "count": row[1] or 0,
                "total_credits": row[2] or 0,
                "average_credits": round(float(row[3]) if row[3] else 0, 2),
            }
            for row in results
        ]

        return formatted_results
