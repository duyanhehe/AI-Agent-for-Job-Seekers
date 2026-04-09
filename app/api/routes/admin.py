"""Admin endpoints for system statistics and management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_admin
from app.models.user import User
from app.services.admin.check_rate_limit import RateLimitChecker
from app.services.admin.stats_service import AdminStatsService
from app.services.admin.users_service import AdminUsersService
from app.services.admin.usage_service import AdminUsageService
from app.services.admin.llm_usage_service import AdminLLMUsageService

router = APIRouter(tags=["admin"])


@router.get("/admin/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get system statistics and usage metrics.
    Requires admin role.
    """
    require_admin(current_user)

    try:
        stats = AdminStatsService.get_stats(db)
        return {"status": "success", "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/users")
async def get_admin_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get list of all users in the system.
    Requires admin role.

    Query parameters:
    - skip: Number of records to skip (default: 0)
    - limit: Number of records to return (default: 100, max: 100)
    """
    require_admin(current_user)

    try:
        users_data = AdminUsersService.get_users(db, skip, limit)
        return {"status": "success", "data": users_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/usage")
async def get_admin_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    sort_by: str = "most_used",
):
    """
    Get system usage and API metrics.
    Includes OpenRouter API rate limits, credits, and LLM function usage.
    Requires admin role.

    Query parameters:
    - sort_by: Sort LLM function usage by one of:
               "most_used" (default), "least_used", "most_credits", "least_credits"
    """
    require_admin(current_user)

    try:
        # Get application usage metrics
        applications = AdminUsageService.get_application_usage(db)

        # Get LLM function usage with sorting
        llm_usage = AdminLLMUsageService.get_function_usage(db, sort_by=sort_by)

        # Get OpenRouter API usage
        rate_limit_checker = RateLimitChecker()
        api_usage = await rate_limit_checker.get_credit_summary()

        return {
            "status": "success",
            "data": {
                "applications": applications,
                "llm_usage": llm_usage,
                "api": api_usage.get("data")
                if api_usage.get("status") == "success"
                else {"error": api_usage.get("message", "Unable to fetch API usage")},
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
