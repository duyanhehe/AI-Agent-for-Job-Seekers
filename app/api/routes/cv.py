"""CV upload, storage, and per-CV settings."""

from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import UPLOAD_DIR
from app.core.dependencies import (
    get_current_user,
    get_db,
    get_llm_service,
    get_reader,
    get_rate_limit_service,
    index_manager,
)
from app.models.chat_history import ChatHistory
from app.models.cv_documents import CVDocuments
from app.models.job_matched_history import JobMatchedHistory
from app.models.user_profiles import UserProfile
from app.schemas.job_preference import JobPreference
from app.services.cache.cache_service import (
    cache_delete_pattern,
    cache_get,
    cache_set,
)
from app.utils.cache_hash import make_hash, normalize
from app.utils.cv_parsers import extract_basic_info
from app.utils.file_utils import validate_file

router = APIRouter(tags=["cv"])


def job_preference_form(
    job_function: str = Form(...),
    job_type: str = Form(...),
    location: str = Form(...),
) -> JobPreference:
    """Parse multipart form fields into a JobPreference schema."""
    return JobPreference(
        job_function=job_function,
        job_type=job_type,
        location=location,
    )


@router.post("/upload/cv")
async def upload_cv(
    job_preference: JobPreference = Depends(job_preference_form),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    reader=Depends(get_reader),
    llm_service=Depends(get_llm_service),
    rate_limit=Depends(get_rate_limit_service),
):
    """Upload a CV, extract profile, match jobs, and persist history with caching."""
    validate_file(file)

    file_path = UPLOAD_DIR / f"{uuid4()}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        text = reader.read(file_path)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse CV")

    cv = (
        db.query(CVDocuments)
        .filter(
            CVDocuments.user_id == user.id,
            CVDocuments.content == text,
        )
        .first()
    )
    has_primary = (
        db.query(CVDocuments).filter(
            CVDocuments.user_id == user.id, CVDocuments.is_primary.is_(True)
        )
    ).first()

    if not cv:
        cv = CVDocuments(
            user_id=user.id,
            file_path=str(file_path),
            file_name=file.filename,
            content=text,
            is_primary=False if has_primary else True,
        )
        db.add(cv)
        db.commit()
        db.refresh(cv)
        print("Created new CV")
    else:
        if not cv.file_name or cv.file_name != file.filename:
            cv.file_name = file.filename
            db.commit()
    print("Reusing existing CV (filename updated)")

    basic_info = extract_basic_info(text)
    profile_cache_key = f"profile:{user.id}:{make_hash(text)}"
    profile = cache_get(profile_cache_key)

    if not profile:
        # Check and consume credits
        rate_limit.check_and_consume(user.id, "extract_profile", weight=1)
        
        profile = await llm_service.extract_profile(text, basic_info)
        cache_set(profile_cache_key, profile, ttl=3600)

    skills = profile.get("skills", []) or []
    existing_profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user.id, UserProfile.cv_id == cv.id)
        .first()
    )

    if existing_profile:
        existing_profile.profile = profile
    else:
        db_profile = UserProfile(user_id=user.id, cv_id=cv.id, profile=profile)
        db.add(db_profile)

    db.commit()

    cache_key = f"jobs:{user.id}:{cv.id}:{normalize(job_preference.job_function)}:{normalize(job_preference.job_type)}:{normalize(job_preference.location)}"
    cached = cache_get(cache_key)

    if cached:
        return cached

    result = index_manager.matchJobs(
        text=text,
        skills=skills,
        job_function=job_preference.job_function,
        job_type=job_preference.job_type,
        location=job_preference.location,
    )

    history = (
        db.query(JobMatchedHistory)
        .filter(
            JobMatchedHistory.user_id == user.id,
            JobMatchedHistory.cv_id == cv.id,
        )
        .first()
    )

    if history:
        history.job_function = job_preference.job_function
        history.job_type = job_preference.job_type
        history.location = job_preference.location
        history.jobs = result["jobs"]
        print("Updated history")
    else:
        history = JobMatchedHistory(
            user_id=user.id,
            cv_id=cv.id,
            job_function=job_preference.job_function,
            job_type=job_preference.job_type,
            location=job_preference.location,
            jobs=result["jobs"],
        )
        db.add(history)
        print("Created history")

    db.commit()

    response = {
        "cv_id": cv.id,
        "file_name": cv.file_name,
        "cv_text": text,
        "profile": profile,
        "skills": skills,
        "warning": result["warning"],
        "jobs": result["jobs"],
    }

    cache_set(cache_key, response, ttl=3600)

    return response


@router.delete("/cv/{cv_id}")
def delete_cv(
    cv_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a CV row, related history, and invalidate caches for that CV."""
    cv = (
        db.query(CVDocuments)
        .filter(CVDocuments.id == cv_id, CVDocuments.user_id == user.id)
        .first()
    )

    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    db.query(JobMatchedHistory).filter(JobMatchedHistory.cv_id == cv_id).delete()
    db.query(UserProfile).filter(UserProfile.cv_id == cv_id).delete()
    db.query(ChatHistory).filter(ChatHistory.user_id == user.id).delete()

    db.delete(cv)
    db.commit()

    cache_delete_pattern(f"jobs:{user.id}:{cv_id}:*")
    cache_delete_pattern(f"profile:{user.id}:*")
    cache_delete_pattern(f"interview:{user.id}:{cv_id}:*")

    return {"message": "CV deleted"}


@router.put("/cv/{cv_id}/rename")
def rename_cv(
    cv_id: int,
    new_name: str = Form(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the display file name for a CV owned by the user."""
    cv = (
        db.query(CVDocuments)
        .filter(CVDocuments.id == cv_id, CVDocuments.user_id == user.id)
        .first()
    )

    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    cv.file_name = new_name
    db.commit()

    return {"message": "Renamed", "file_name": new_name}


@router.put("/cv/{cv_id}/set-primary")
def set_primary_cv(
    cv_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark one CV as primary and clear primary on all others for this user."""
    db.query(CVDocuments).filter(CVDocuments.user_id == user.id).update(
        {"is_primary": 0}
    )

    cv = (
        db.query(CVDocuments)
        .filter(CVDocuments.id == cv_id, CVDocuments.user_id == user.id)
        .first()
    )

    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    cv.is_primary = 1
    db.commit()

    return {"message": "Primary CV set"}
