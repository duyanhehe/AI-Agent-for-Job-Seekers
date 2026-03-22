from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    Form,
    Response,
    HTTPException,
)
from sqlalchemy.orm import Session
from uuid import uuid4

from app.services.country_service import get_countries
from app.services.cache_service import cache_get, cache_set

from app.schemas.auth import SignupRequest, LoginRequest
from app.schemas.job_preference import JobPreference
from app.schemas.job_analysis import JobAnalysisRequest
from app.schemas.job_question import JobQuestionRequest

from app.utils.file_utils import validate_file

from app.config import UPLOAD_DIR
from app.core.dependencies import (
    index_manager,
    get_db,
    auth_service,
    get_current_user,
    get_reader,
    get_llm_service,
    get_skill_extractor,
)

from app.models.cv_documents import CVDocuments
from app.models.job_matched_history import JobMatchedHistory
from app.models.chat_history import ChatHistory


router = APIRouter()


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
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    reader=Depends(get_reader),
    skill_extractor=Depends(get_skill_extractor),
):
    # Validate file type
    validate_file(file)

    # Save file
    file_path = UPLOAD_DIR / f"{uuid4()}_{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text
    try:
        text = reader.read(file_path)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse CV")

    # Cache check
    cache_key = f"jobs:{user.id}:{hash(text)}"
    cached = cache_get(cache_key)

    if cached:
        return cached

    # Extract skills
    skills = await skill_extractor.extract_skills(text)

    # Match jobs
    result = index_manager.matchJobs(
        text=text,
        skills=skills,
        job_function=job_preference.job_function,
        job_type=job_preference.job_type,
        location=job_preference.location,
    )

    # Save CV
    cv = CVDocuments(
        user_id=user.id,
        file_path=str(file_path),
        content=text,
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)

    # Save matched jobs history
    history = JobMatchedHistory(
        user_id=user.id,
        cv_id=cv.id,
        jobs=result["jobs"],
    )
    db.add(history)
    db.commit()

    response = {
        "cv_text": text,
        "skills": skills,
        "warning": result["warning"],
        "jobs": result["jobs"],
    }

    # Cache result
    cache_set(cache_key, response)

    return response


# --------------------------------------------------
# Analyze job match
# --------------------------------------------------


@router.post("/job/analyze")
async def analyze_job(
    data: JobAnalysisRequest,
    user=Depends(get_current_user),
    llm_service=Depends(get_llm_service),
):
    job = index_manager.jobs_data[data.job_id]

    analysis = await llm_service.match_cv_to_job(data.cv_text, job)

    return {"job": job, "analysis": analysis}


# --------------------------------------------------
# Ask question about job
# --------------------------------------------------


@router.post("/job/question")
async def ask_job_question(
    data: JobQuestionRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_service=Depends(get_llm_service),
):
    job = index_manager.jobs_data[data.job_id]

    answer = await llm_service.answer_job_question(data.cv_text, job, data.question)

    # Save chat history
    chat = ChatHistory(
        user_id=user.id,
        job_id=data.job_id,
        question=data.question,
        answer=str(answer),
    )

    db.add(chat)
    db.commit()

    return {"job": job, "question": data.question, "result": answer}
