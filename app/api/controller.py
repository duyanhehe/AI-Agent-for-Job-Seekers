from fastapi import (
    APIRouter,
    Depends,
    File,
    Request,
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
from app.schemas.job_recalculate import JobRecalculateRequest
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


@router.post("/auth/logout")
def logout(request: Request, response: Response):
    session_id = request.cookies.get("session_id")

    if session_id:
        auth_service.delete_session(session_id)

    response.delete_cookie("session_id")

    return {"message": "Logged out"}


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
    # Validate file
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

    # FIND EXISTING CV
    cv = (
        db.query(CVDocuments)
        .filter(
            CVDocuments.user_id == user.id,
            CVDocuments.content == text,
        )
        .first()
    )

    if not cv:
        cv = CVDocuments(
            user_id=user.id,
            file_path=str(file_path),
            content=text,
        )
        db.add(cv)
        db.commit()
        db.refresh(cv)
        print("Created new CV")
    else:
        print("Reusing existing CV")

    # CACHE SKILLS (REDIS)
    skill_cache_key = f"skills:{user.id}:{hash(text)}"
    skills = cache_get(skill_cache_key)

    if not skills:
        skills = await skill_extractor.extract_skills(text)
        cache_set(skill_cache_key, skills)
        print("Extracted & cached skills")
    else:
        print("Loaded skills from cache")

    # CACHE JOB RESULTS
    cache_key = f"jobs:{user.id}:{cv.id}:{job_preference.job_function}:{job_preference.job_type}:{job_preference.location}"
    cached = cache_get(cache_key)

    if cached:
        return cached

    # MATCH JOBS
    result = index_manager.matchJobs(
        text=text,
        skills=skills,
        job_function=job_preference.job_function,
        job_type=job_preference.job_type,
        location=job_preference.location,
    )

    # UPSERT HISTORY (1 per CV)
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
        "cv_text": text,
        "skills": skills,
        "warning": result["warning"],
        "jobs": result["jobs"],
    }

    cache_set(cache_key, response)

    return response


@router.post("/job/recalculate")
async def recalculate_jobs(
    data: JobRecalculateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    skill_extractor=Depends(get_skill_extractor),
):
    text = data.cv_text

    # CACHE SKILLS (REDIS)
    skill_cache_key = f"skills:{user.id}:{hash(text)}"
    cached_skills = cache_get(skill_cache_key)

    if cached_skills:
        skills = cached_skills
        print("Loaded skills from cache")
    else:
        skills = await skill_extractor.extract_skills(text)
        cache_set(skill_cache_key, skills)
        print("Extracted & cached skills")

    # MATCH JOBS
    result = index_manager.matchJobs(
        text=text,
        skills=skills,
        job_function=data.job_function,
        job_type=data.job_type,
        location=data.location,
    )

    # Update job match history
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

    return {
        "jobs": result["jobs"],
        "warning": result["warning"],
    }


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
        answer=answer.get("answer", ""),
    )

    db.add(chat)
    db.commit()

    return {"job": job, "question": data.question, "result": answer}


# --------------------------------------------------
# Get user history
# --------------------------------------------------
@router.get("/user/dashboard")
def get_dashboard(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    job_history = []

    for h in histories:
        cv = db.query(CVDocuments).filter(CVDocuments.id == h.cv_id).first()

        job_history.append(
            {
                "cv_id": h.cv_id,
                "cv_text": cv.content if cv else "",
                "job_function": h.job_function,
                "job_type": h.job_type,
                "location": h.location,
                "jobs": h.jobs,
            }
        )

    return {
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
