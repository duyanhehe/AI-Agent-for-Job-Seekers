"""User-submitted external job postings."""

from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, get_llm_service
from app.models.external_jobs import ExternalJob
from app.schemas.external_job import ExternalJobCreate, ExternalJobResponse

router = APIRouter(tags=["external-jobs"])


@router.post("/external-jobs", response_model=ExternalJobResponse)
async def save_external_job(
    title: str = Form(...),
    url: str = Form(...),
    company: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_service=Depends(get_llm_service),
):
    """Parse a pasted job description with the LLM and store an ExternalJob row."""
    data = ExternalJobCreate(
        title=title,
        url=url,
        company=company,
        location=location,
        description=description,
    )

    extracted = await llm_service.extract_external_job(data.description, user.id, db)

    external_job = ExternalJob(
        user_id=user.id,
        title=data.title,
        company=data.company,
        location=data.location,
        url=data.url,
        description=data.description,
        job_type=extracted.get("job_type"),
        salary=extracted.get("salary"),
        work_from_home=extracted.get("work_from_home", False),
        skills=extracted.get("skills", []),
        type_skills=extracted.get("type_skills", {}),
        job_function=extracted.get("job_function"),
    )

    db.add(external_job)
    db.commit()
    db.refresh(external_job)

    return {
        "id": external_job.id,
        "job_role": external_job.title,
        "company": external_job.company,
        "location": external_job.location,
        "url": external_job.url,
        "job_type": external_job.job_type,
        "salary": external_job.salary,
        "work_from_home": external_job.work_from_home,
        "skills": external_job.skills,
        "type_skills": external_job.type_skills,
        "is_external": True,
    }


@router.get("/external-jobs")
async def get_external_jobs(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all external jobs saved by the current user."""
    jobs = db.query(ExternalJob).filter(ExternalJob.user_id == user.id).all()

    return [
        {
            "id": j.id,
            "job_role": j.title,
            "company": j.company,
            "location": j.location,
            "url": j.url,
            "job_type": j.job_type,
            "salary": j.salary,
            "skills": j.skills,
            "type_skills": j.type_skills,
            "is_external": True,
        }
        for j in jobs
    ]
