from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    Form,
    Response,
    Request,
    HTTPException,
)
from sqlalchemy.orm import Session
from uuid import uuid4

from app.services.document_reader import DocumentReader
from app.services.llm_service import LLMService
from app.services.skill_extractor import SkillExtractor
from app.services.country_service import get_countries
from app.services.auth_service import AuthService
from app.schemas.auth import SignupRequest, LoginRequest
from app.schemas.job_preference import JobPreference
from app.schemas.job_analysis import JobAnalysisRequest
from app.schemas.job_question import JobQuestionRequest
from app.config import UPLOAD_DIR
from app.core.dependencies import index_manager, get_db

router = APIRouter()

reader = DocumentReader()
llm_service = LLMService()
skill_extractor = SkillExtractor()
auth_service = AuthService()

# --------------------------------------------------
# Authentication
# --------------------------------------------------


@router.post("/auth/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    user = auth_service.create_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=400, detail="Email already exists")

    return {"message": "User created"}


@router.post("/auth/login")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = auth_service.create_session(user.id)

    response.set_cookie(key="session_id", value=session_id, httponly=True)

    return {"message": "Logged in"}


# --------------------------------------------------
# Helpers form parsers
# --------------------------------------------------


def job_preference_form(
    job_function: str = Form(...),
    job_type: str = Form(...),
    location: str = Form(...),
) -> JobPreference:
    return JobPreference(
        job_function=job_function,
        job_type=job_type,
        location=location,
    )


# --------------------------------------------------
# (dropdown values)
# --------------------------------------------------


@router.get("/job-functions")
def get_job_functions():
    return {"job_functions": index_manager.get_job_functions()}


@router.get("/countries")
def countries():
    return {"countries": get_countries()}


# --------------------------------------------------
# Upload CV + get job matches
# --------------------------------------------------


@router.post("/upload/cv")
async def upload_cv(
    job_preference: JobPreference = Depends(job_preference_form),
    file: UploadFile = File(...),
):

    file_path = UPLOAD_DIR / f"{uuid4()}_{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text
    try:
        text = reader.read(file_path)
    except Exception:
        return {"error": "Failed to parse CV"}

    # Extract skills
    skills = await skill_extractor.extract_skills(text)

    # Fast job retrieval (NO LLM)
    result = index_manager.matchJobs(
        text=text,
        skills=skills,
        job_function=job_preference.job_function,
        job_type=job_preference.job_type,
        location=job_preference.location,
    )

    return {
        "cv_text": text,
        "skills": skills,
        "warning": result["warning"],
        "jobs": result["jobs"],
    }


# --------------------------------------------------
# Analyze job match
# --------------------------------------------------


@router.post("/job/analyze")
async def analyze_job(data: JobAnalysisRequest):

    cv_text = data.cv_text
    job_id = data.job_id

    job = index_manager.jobs_data[job_id]

    analysis = await llm_service.match_cv_to_job(cv_text, job)

    return {"job": job, "analysis": analysis}


# --------------------------------------------------
# Ask question about job
# --------------------------------------------------


@router.post("/job/question")
async def ask_job_question(data: JobQuestionRequest):

    cv_text = data.cv_text
    job_id = data.job_id
    question = data.question

    job = index_manager.jobs_data[job_id]

    answer = await llm_service.answer_job_question(cv_text, job, question)

    return {"job": job, "question": question, "result": answer}
