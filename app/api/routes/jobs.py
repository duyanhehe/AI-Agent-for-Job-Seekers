"""Job matching, analysis, Q&A, and user actions on listings."""

from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_db,
    get_llm_service,
    get_rate_limit_service,
    get_index_manager,
)
from app.models.chat_history import ChatHistory
from app.models.job_actions import JobAction
from app.models.job_matched_history import JobMatchedHistory
from app.schemas.job_analysis import JobAnalysisRequest
from app.schemas.job_question import JobQuestionRequest
from app.schemas.job_recalculate import JobRecalculateRequest
from app.services.cache.cache_service import cache_delete_pattern, cache_get, cache_set
from app.utils.cache_hash import make_hash, normalize

router = APIRouter(tags=["jobs"])


@router.post("/job/recalculate")
async def recalculate_jobs(
    data: JobRecalculateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_service=Depends(get_llm_service),
    rate_limit=Depends(get_rate_limit_service),
    index_manager=Depends(get_index_manager),
):
    """Re-run matching for a CV with new filters; refresh profile cache if needed."""
    text = data.cv_text

    profile_cache_key = f"profile:{user.id}:{make_hash(text)}"
    profile = cache_get(profile_cache_key)

    if not profile:
        rate_limit.check_and_consume(user.id, weight=1)

        profile = await llm_service.extract_profile(text, user.id, db)
        cache_set(profile_cache_key, profile, ttl=3600)

    skills = profile.get("skills", []) or []

    result = index_manager.matchJobs(
        text=text,
        skills=skills,
        job_function=data.job_function,
        job_type=data.job_type,
        location=data.location,
        date_filter=data.date_filter,
    )

    history = (
        db.query(JobMatchedHistory)
        .filter(
            JobMatchedHistory.cv_id == data.cv_id,
            JobMatchedHistory.user_id == user.id,
        )
        .first()
    )

    if history:
        history.jobs = result["jobs"]
        history.job_function = data.job_function
        history.job_type = data.job_type
        history.location = data.location
    else:
        history = JobMatchedHistory(
            user_id=user.id,
            cv_id=data.cv_id,
            jobs=result["jobs"],
            job_function=data.job_function,
            job_type=data.job_type,
            location=data.location,
        )
        db.add(history)

    db.commit()

    cache_delete_pattern(
        f"jobs:{user.id}:{data.cv_id}:{normalize(data.job_function)}:*"
    )

    return {
        "jobs": result["jobs"],
        "warning": result["warning"],
    }


@router.post("/job/analyze")
async def analyze_job(
    data: JobAnalysisRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_service=Depends(get_llm_service),
    rate_limit=Depends(get_rate_limit_service),
    index_manager=Depends(get_index_manager),
):
    """Compare CV text to a single indexed job with optional RAG context."""
    job = index_manager.jobs_data[data.job_id]

    rag_cache_key = f"rag:{data.job_id}"

    rag_context = cache_get(rag_cache_key)

    if not rag_context:
        rag_context = index_manager.build_rag_context(
            f"{job.get('job_role', '')} {job.get('job_function', '')}"
        )
        cache_set(rag_cache_key, rag_context, ttl=3600)

    # Note: match_cv_to_job has its own LLM call inside which is cached in LLMService.
    # However, for user credit tracking, we'll consume here if not in analysis cache (if it had one, but it doesn't).
    # Since LLMService does the internal caching, we can't easily skip consumption here.
    # But for match_cv_to_job, it's safer to just consume 1 credit.
    rate_limit.check_and_consume(user.id, weight=1)

    analysis = await llm_service.match_cv_to_job(
        data.cv_text, job, user.id, db, rag_context=rag_context
    )

    return {"job": job, "analysis": analysis}


@router.post("/job/question")
async def ask_job_question(
    data: JobQuestionRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_service=Depends(get_llm_service),
    rate_limit=Depends(get_rate_limit_service),
    index_manager=Depends(get_index_manager),
):
    """Answer a question about a job using the CV and persist chat history."""
    job = index_manager.jobs_data[data.job_id]

    rag_cache_key = f"rag:q:{data.job_id}"

    rag_context = cache_get(rag_cache_key)
    if not rag_context:
        rag_context = index_manager.build_rag_context(
            f"{job.get('job_role', '')} {data.question}"
        )
        cache_set(rag_cache_key, rag_context, ttl=3600)

    rate_limit.check_and_consume(user.id, weight=1)

    answer = await llm_service.answer_job_question(
        data.cv_text, job, data.question, user.id, db, rag_context=rag_context
    )
    answer_text = ""

    if isinstance(answer, dict):
        answer_text = answer.get("answer", "")
    else:
        answer_text = ""

    chat = ChatHistory(
        user_id=user.id, job_id=data.job_id, question=data.question, answer=answer_text
    )

    db.add(chat)
    db.commit()

    return {"job": job, "question": data.question, "result": answer}


@router.post("/job/action")
def save_job_action(
    job_id: int = Form(...),
    status: str = Form(...),
    reason: str = Form(None),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record like/apply/hide/report for a job and refresh the actions cache."""
    action = (
        db.query(JobAction)
        .filter(JobAction.user_id == user.id, JobAction.job_id == job_id)
        .first()
    )

    if action:
        action.status = status
        action.reason = reason
    else:
        action = JobAction(
            user_id=user.id,
            job_id=job_id,
            status=status,
            reason=reason,
        )
        db.add(action)

    db.commit()

    cache_key = f"job_actions:{user.id}"
    actions = cache_get(cache_key) or {}

    actions[str(job_id)] = {"status": status, "reason": reason}
    cache_set(cache_key, actions, ttl=3600)

    return {"message": "saved"}
