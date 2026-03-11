from fastapi import APIRouter, File, UploadFile, Form
from uuid import uuid4

from app.services.document_reader import DocumentReader
from app.services.llm_service import LLMService
from app.services.skill_extractor import SkillExtractor
from app.schemas.job_preference import JobPreference
from app.config import UPLOAD_DIR
from app.core.dependencies import index_manager

router = APIRouter()

reader = DocumentReader()
llm_service = LLMService()
skill_extractor = SkillExtractor()


# --------------------------------------------------
# Job filters (dropdown values)
# --------------------------------------------------


@router.get("/jobs/filters")
def get_job_filters():
    return index_manager.get_filters()


# Optional: hierarchical categories
@router.get("/jobs/categories")
def get_job_categories():
    return index_manager.get_job_categories()


# --------------------------------------------------
# Upload CV + get job matches
# --------------------------------------------------


@router.post("/upload/cv")
async def upload_cv(
    job_function: str = Form(None),
    job_role: str = Form(None),
    job_type: str = Form(None),
    location: str = Form(None),
    file: UploadFile = File(...),
):

    file_path = UPLOAD_DIR / f"{uuid4()}_{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text
    text = reader.read(file_path)

    # Extract skills
    skills = await skill_extractor.extract_skills(text)

    # Fast job retrieval (NO LLM)
    jobs = index_manager.matchJobs(
        text=text,
        skills=skills,
        job_function=job_function,
        job_role=job_role,
        job_type=job_type,
        location=location,
    )

    return {"cv_text": text, "skills": skills, "jobs": jobs[:10]}


# --------------------------------------------------
# Analyze job match
# --------------------------------------------------


@router.post("/job/analyze")
async def analyze_job(data: dict):

    cv_text = data["cv_text"]
    job = data["job"]

    analysis = await llm_service.match_cv_to_job(cv_text, job)

    return {"job": job, "analysis": analysis}
