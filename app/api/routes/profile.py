"""User profile JSON and DOCX export."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.cv_documents import CVDocuments
from app.models.user_profiles import UserProfile
from app.services.documents.profile_export_service import export_profile_docx_service

router = APIRouter(tags=["profile"])


@router.put("/profile")
def update_profile(
    profile: dict,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upsert structured profile JSON for the user's primary CV."""
    cv = (
        db.query(CVDocuments)
        .filter(
            CVDocuments.user_id == user.id,
            CVDocuments.is_primary.is_(True),
        )
        .first()
    )

    if not cv:
        raise HTTPException(status_code=404, detail="Primary CV not found")

    existing = (
        db.query(UserProfile)
        .filter(
            UserProfile.user_id == user.id,
            UserProfile.cv_id == cv.id,
        )
        .first()
    )

    if not existing:
        existing = UserProfile(
            user_id=user.id,
            cv_id=cv.id,
            profile=profile,
        )
        db.add(existing)
    else:
        existing.profile = profile

    db.commit()
    db.refresh(existing)
    return {"message": "Profile updated", "profile": existing.profile}


@router.get("/profile/export/docx")
def export_profile_docx(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stream a DOCX resume generated from the primary CV profile."""
    return export_profile_docx_service(user.id, db)
