from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json

from app.core.dependencies import (
    get_current_user,
    get_db,
    get_llm_service,
    get_rate_limit_service,
)
from app.models.job_applications import JobApplication
from app.models.cv_documents import CVDocuments
from app.models.user_profiles import UserProfile
from app.schemas.application import (
    ApplicationPrepareRequest,
    ApplicationCreateRequest,
    ApplicationResponse,
)
from app.services.llm.llm_service import LLMService
from app.services.cache.cache_service import cache_get, cache_set
from app.utils.cache_hash import make_hash

router = APIRouter(tags=["applications"])


@router.post("/prepare", response_model=Dict[str, Any])
async def prepare_application(
    req: ApplicationPrepareRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_service: LLMService = Depends(get_llm_service),
    rate_limit=Depends(get_rate_limit_service),
):
    """
    Extract profile from CV and generate a custom cover letter for a specific job.
    """
    try:
        # Validate cv_id is an integer
        if not isinstance(req.cv_id, int) or req.cv_id <= 0:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid cv_id: must be a positive integer, got {req.cv_id}",
            )

        # Get CV content
        cv = (
            db.query(CVDocuments)
            .filter(CVDocuments.id == req.cv_id, CVDocuments.user_id == user.id)
            .first()
        )
        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")

        # Get user profile
        user_profile = (
            db.query(UserProfile)
            .filter(UserProfile.user_id == user.id, UserProfile.cv_id == cv.id)
            .first()
        )
        profile_data = user_profile.profile if user_profile else {}

        # Create cache key based on job and CV content
        cache_key = f"cover_letter:{user.id}:{req.cv_id}:{make_hash(req.job_title + req.company + req.job_description)}:{req.tone}"
        cached_result = cache_get(cache_key)

        if cached_result:
            return cached_result

        # Generate Cover Letter
        rate_limit.check_and_consume(user.id, "generate_cover_letter", weight=2)
        
        job_details = {
            "title": req.job_title,
            "company": req.company,
            "description": req.job_description,
        }
        cl_result = await llm_service.generate_cover_letter(
            cv.content, job_details, tone=req.tone
        )

        response = {
            "autofill_data": profile_data,
            "cover_letter": cl_result.get("cover_letter", ""),
            "tone": req.tone,
        }

        # Cache the result
        cache_set(cache_key, response, ttl=3600)

        return response

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/", response_model=ApplicationResponse)
async def create_or_update_application(
    req: ApplicationCreateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save as draft or submit an application.
    """
    # Check if application already exists for this job
    existing = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user.id, JobApplication.job_id == req.job_id)
        .first()
    )

    if existing:
        for key, value in req.dict().items():
            setattr(existing, key, value)
        existing.status = req.status
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_app = JobApplication(user_id=user.id, **req.dict())
        db.add(new_app)
        db.commit()
        db.refresh(new_app)
        return new_app


@router.get("/history", response_model=List[ApplicationResponse])
async def get_application_history(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's application history.
    """
    apps = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user.id)
        .order_by(JobApplication.applied_at.desc())
        .all()
    )
    return apps
