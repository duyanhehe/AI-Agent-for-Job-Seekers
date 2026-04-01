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
from app.services.cache_service import (
    cache_get,
    cache_set,
    cache_delete_pattern,
)
from app.services.profile_export_service import export_profile_docx_service

from app.schemas.auth import SignupRequest, LoginRequest
from app.schemas.job_preference import JobPreference
from app.schemas.job_analysis import JobAnalysisRequest
from app.schemas.job_recalculate import JobRecalculateRequest
from app.schemas.job_question import JobQuestionRequest
from app.schemas.external_job import ExternalJobCreate, ExternalJobResponse

from app.utils.file_utils import validate_file
from app.utils.cv_parsers import extract_basic_info
from app.utils.cache_hash import make_hash, normalize

from app.config import UPLOAD_DIR
from app.core.dependencies import (
    index_manager,
    get_db,
    auth_service,
    get_current_user,
    get_reader,
    get_llm_service,
)

from app.models.cv_documents import CVDocuments
from app.models.job_matched_history import JobMatchedHistory
from app.models.chat_history import ChatHistory
from app.models.job_actions import JobAction
from app.models.user_profiles import UserProfile
from app.models.external_jobs import ExternalJob


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


@router.get("/auth/me")
def get_me(user=Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
    }


@router.post("/auth/reset-password")
def reset_password(
    old_password: str = Form(...),
    new_password: str = Form(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    print("OLD PASSWORD INPUT:", old_password)
    print("HASH IN DB:", user.password_hash)
    print(
        "VERIFY RESULT:", auth_service.verify_password(old_password, user.password_hash)
    )
    # Verify old password
    if not auth_service.verify_password(old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")

    # Update password
    user.password_hash = auth_service.hash_password(new_password)
    db.commit()
    db.refresh(user)

    return {"message": "Password updated"}


@router.delete("/auth/delete-account")
def delete_account(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(JobMatchedHistory).filter_by(user_id=user.id).delete()
    db.query(ChatHistory).filter_by(user_id=user.id).delete()
    db.query(JobAction).filter_by(user_id=user.id).delete()
    db.query(UserProfile).filter_by(user_id=user.id).delete()
    db.query(CVDocuments).filter_by(user_id=user.id).delete()

    db.delete(user)
    db.commit()

    return {"message": "Account deleted"}


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


# Upload CV, extract skills, match jobs, save history, cache results
@router.post("/upload/cv")
async def upload_cv(
    job_preference: JobPreference = Depends(job_preference_form),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    reader=Depends(get_reader),
    llm_service=Depends(get_llm_service),
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

    # EXTRACT PROFILE & SAVE (with caching)
    basic_info = extract_basic_info(text)
    profile_cache_key = f"profile:{user.id}:{make_hash(text)}"
    profile = cache_get(profile_cache_key)

    if not profile:
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

    # CACHE JOB RESULTS
    cache_key = f"jobs:{user.id}:{cv.id}:{normalize(job_preference.job_function)}:{normalize(job_preference.job_type)}:{normalize(job_preference.location)}"
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
        "file_name": cv.file_name,
        "cv_text": text,
        "profile": profile,
        "skills": skills,
        "warning": result["warning"],
        "jobs": result["jobs"],
    }

    cache_set(cache_key, response, ttl=3600)

    return response


# Delete CV + related history
@router.delete("/cv/{cv_id}")
def delete_cv(
    cv_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cv = (
        db.query(CVDocuments)
        .filter(CVDocuments.id == cv_id, CVDocuments.user_id == user.id)
        .first()
    )

    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    # delete related history
    db.query(JobMatchedHistory).filter(JobMatchedHistory.cv_id == cv_id).delete()

    # delete related chats
    db.query(ChatHistory).filter(ChatHistory.user_id == user.id).delete()

    db.delete(cv)
    db.commit()

    # cache invalidation
    cache_delete_pattern(f"jobs:{user.id}:{cv_id}:*")
    cache_delete_pattern(f"profile:{user.id}:*")

    return {"message": "CV deleted"}


# Rename CV
@router.put("/cv/{cv_id}/rename")
def rename_cv(
    cv_id: int,
    new_name: str = Form(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
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


# Set primary CV
@router.put("/cv/{cv_id}/set-primary")
def set_primary_cv(
    cv_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # reset all
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


# Re-analyze job match
@router.post("/job/recalculate")
async def recalculate_jobs(
    data: JobRecalculateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    llm_service=Depends(get_llm_service),
):
    text = data.cv_text

    # CACHE SKILLS (REDIS)
    profile_cache_key = f"profile:{user.id}:{make_hash(text)}"
    profile = cache_get(profile_cache_key)

    if not profile:
        profile = await llm_service.extract_profile(text)
        cache_set(profile_cache_key, profile, ttl=3600)

    skills = profile.get("skills", []) or []

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

    # CACHE INVALIDATION
    cache_delete_pattern(
        f"jobs:{user.id}:{data.cv_id}:{normalize(data.job_function)}:*"
    )

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
    answer_text = ""

    if isinstance(answer, dict):
        answer_text = answer.get("answer", "")
    else:
        answer_text = ""

    # Save chat history
    chat = ChatHistory(
        user_id=user.id, job_id=data.job_id, question=data.question, answer=answer_text
    )

    db.add(chat)
    db.commit()

    return {"job": job, "question": data.question, "result": answer}


# --------------------------------------------------
# Job actions (like, apply, hide, report)
# --------------------------------------------------
@router.post("/job/action")
def save_job_action(
    job_id: int = Form(...),
    status: str = Form(...),
    reason: str = Form(None),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # UPSERT DB
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

    # CACHE (Redis)
    cache_key = f"job_actions:{user.id}"
    actions = cache_get(cache_key) or {}

    actions[str(job_id)] = {"status": status, "reason": reason}
    cache_set(cache_key, actions, ttl=3600)

    return {"message": "saved"}


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

    # LOAD JOB ACTIONS
    cache_key = f"job_actions:{user.id}"
    actions = cache_get(cache_key)

    if not actions:
        db_actions = db.query(JobAction).filter(JobAction.user_id == user.id).all()

        actions = {
            str(a.job_id): {"status": a.status, "reason": a.reason} for a in db_actions
        }

        cache_set(cache_key, actions, ttl=3600)

    # JOB HISTORY
    job_history = []
    for h in histories:
        cv = db.query(CVDocuments).filter(CVDocuments.id == h.cv_id).first()

        jobs_with_status = []

        for job in h.jobs or []:
            job_id = str(job.get("job_id"))

            action = actions.get(job_id, {})

            job["status"] = action.get("status")  # liked/applied/hidden/reported
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


# --------------------------------------------------
# Save external job
# --------------------------------------------------


@router.post("/external-job", response_model=ExternalJobResponse)
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
    # Wrap into schema
    data = ExternalJobCreate(
        title=title,
        url=url,
        company=company,
        location=location,
        description=description,
    )

    # LLM extraction (description)
    extracted = await llm_service.extract_external_job(data.description)

    external_job = ExternalJob(
        user_id=user.id,
        # USER INPUT
        title=data.title,
        company=data.company,
        location=data.location,
        url=data.url,
        description=data.description,
        # LLM OUTPUT
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


@router.get("/external-job")
async def get_external_jobs(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
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


# --------------------------------------------------
# UPDATE USER PROFILE
# --------------------------------------------------
@router.put("/profile")
def update_profile(
    profile: dict,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # get PRIMARY CV
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


# Export CV Documents
@router.get("/profile/export/docx")
def export_profile_docx(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return export_profile_docx_service(user.id, db)
