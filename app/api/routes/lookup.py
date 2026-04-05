"""Read-only lists for UI dropdowns (job functions, countries)."""

from fastapi import APIRouter

from app.core.dependencies import index_manager
from app.services.reference.country_service import get_countries

router = APIRouter(tags=["lookup"])


@router.get("/job-functions")
def get_job_functions():
    """Return distinct job function labels from the loaded jobs dataset."""
    return {"job_functions": index_manager.get_job_functions()}


@router.get("/countries")
def countries():
    """Return a sorted list of country names."""
    return {"countries": get_countries()}
