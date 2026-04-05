"""Aggregated API router: compose feature routers into one mount point."""

from fastapi import APIRouter

from app.api.routes import (
    auth,
    cv,
    dashboard,
    external_jobs,
    interview,
    jobs,
    lookup,
    profile,
)

router = APIRouter()

router.include_router(auth.router)
router.include_router(lookup.router)
router.include_router(cv.router)
router.include_router(jobs.router)
router.include_router(dashboard.router)
router.include_router(external_jobs.router)
router.include_router(profile.router)
router.include_router(interview.router)
