"""Mock interview generation and grading."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_llm_service, index_manager
from app.schemas.interview import InterviewAnswerRequest, InterviewRequest
from app.services.cache.cache_service import cache_get, cache_set
from app.utils.cache_hash import make_hash, normalize

router = APIRouter(tags=["interview"])


@router.post("/job/interview")
async def generate_interview(
    data: InterviewRequest,
    user=Depends(get_current_user),
    llm_service=Depends(get_llm_service),
):
    """Return cached or freshly generated interview questions for a CV/job pair."""
    job = index_manager.jobs_data[data.job_id]

    cv_hash = make_hash(normalize(data.cv_text))
    cache_key = f"interview:{user.id}:{data.cv_id}:{data.job_id}:{cv_hash}"

    cached = cache_get(cache_key)
    if cached:
        return cached

    rag_cache_key = f"rag:interview:{data.job_id}"

    rag_context = cache_get(rag_cache_key)
    if not rag_context:
        rag_context = index_manager.build_rag_context(
            f"{job.get('job_role', '')} interview questions"
        )
        cache_set(rag_cache_key, rag_context, ttl=3600)

    result = await llm_service.generate_interview(
        data.cv_text, job, rag_context=rag_context
    )

    response = {
        "job_id": data.job_id,
        "interview": result,
    }

    cache_set(cache_key, response, ttl=3600)

    return response


@router.post("/job/interview/grade")
async def grade_interview(
    data: InterviewAnswerRequest,
    user=Depends(get_current_user),
    llm_service=Depends(get_llm_service),
):
    """Grade interview answers against the job and CV with optional RAG context."""
    job = index_manager.jobs_data[data.job_id]

    rag_cache_key = f"rag:grade:{data.job_id}"

    rag_context = cache_get(rag_cache_key)
    if not rag_context:
        rag_context = index_manager.build_rag_context(
            f"{job.get('job_role', '')} evaluation criteria"
        )
        cache_set(rag_cache_key, rag_context, ttl=3600)

    result = await llm_service.grade_interview(
        data.cv_text, job, data.answers, rag_context=rag_context
    )
    return result
