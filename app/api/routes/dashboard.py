"""Aggregated user dashboard data."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, get_rate_limit_service
from app.models.chat_history import ChatHistory
from app.models.cv_documents import CVDocuments
from app.models.job_actions import JobAction
from app.models.job_matched_history import JobMatchedHistory
from app.models.user_profiles import UserProfile
from app.services.cache.cache_service import cache_get, cache_set

router = APIRouter(tags=["dashboard"])


@router.get("/user/dashboard")
def get_dashboard(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    rate_limit=Depends(get_rate_limit_service),
):
    """Return job match history with per-job actions and recent chat rows."""
    histories = (
        db.query(JobMatchedHistory)
        .filter(JobMatchedHistory.user_id == user.id)
        .order_by(JobMatchedHistory.id.desc())
        .all()
    )

    chats = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user.id)
        .order_by(ChatHistory.id.desc())
        .all()
    )

    cache_key = f"job_actions:{user.id}"
    actions = cache_get(cache_key)

    if not actions:
        db_actions = db.query(JobAction).filter(JobAction.user_id == user.id).all()

        actions = {
            str(a.job_id): {"status": a.status, "reason": a.reason} for a in db_actions
        }

        cache_set(cache_key, actions, ttl=3600)

    job_history = []
    for h in histories:
        cv = db.query(CVDocuments).filter(CVDocuments.id == h.cv_id).first()

        jobs_with_status = []

        for job in h.jobs or []:
            job_id = str(job.get("job_id"))

            action = actions.get(job_id, {})

            job["status"] = action.get("status")
            job["reason"] = action.get("reason")

            jobs_with_status.append(job)

        profile = (
            db.query(UserProfile)
            .filter(UserProfile.user_id == user.id, UserProfile.cv_id == h.cv_id)
            .first()
        )

        job_history.append(
            {
                "cv_id": h.cv_id,
                "cv_text": cv.content if cv else "",
                "file_name": cv.file_name if cv and cv.file_name else "CV",
                "is_primary": cv.is_primary if cv else False,
                "job_function": h.job_function,
                "job_type": h.job_type,
                "location": h.location,
                "profile": profile.profile if profile else {},
                "jobs": jobs_with_status,
            }
        )

    return {
        "credits": rate_limit.get_remaining_credits(user.id),
        "job_history": job_history,
        "chat_history": [
            {
                "job_id": c.job_id,
                "question": c.question,
                "answer": c.answer,
            }
            for c in chats
        ],
    }
