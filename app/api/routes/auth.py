"""Authentication and account lifecycle endpoints."""

from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import auth_service, get_current_user, get_db, get_rate_limit_service
from app.models.chat_history import ChatHistory
from app.models.cv_documents import CVDocuments
from app.models.external_jobs import ExternalJob
from app.models.job_actions import JobAction
from app.models.job_alert_settings import JobAlertSettings
from app.models.job_applications import JobApplication
from app.models.job_matched_history import JobMatchedHistory
from app.models.notification import Notification
from app.models.user_profiles import UserProfile
from app.schemas.auth import LoginRequest, SignupRequest

router = APIRouter(tags=["auth"])


@router.post("/auth/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user; fails if the email is already taken."""
    user = auth_service.create_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=400, detail="Email already exists")

    return {"message": "User created"}


@router.post("/auth/login")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate and set an HTTP-only session cookie."""
    user = auth_service.authenticate_user(db, data.email, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = auth_service.create_session(user.id)

    response.set_cookie(
        key="session_id", value=session_id, httponly=True, samesite="lax"
    )

    return {"message": "Logged in"}


@router.post("/auth/logout")
def logout(request: Request, response: Response):
    """Clear the session cookie and remove the session from Redis."""
    session_id = request.cookies.get("session_id")

    if session_id:
        auth_service.delete_session(session_id)

    response.delete_cookie("session_id")

    return {"message": "Logged out"}


@router.get("/auth/me")
def get_me(user=Depends(get_current_user)):
    """Return the authenticated user's id and email."""
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
    """Update password after verifying the current password."""
    try:
        if not auth_service.verify_password(old_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect old password")

        if len(new_password) < 8:
            raise HTTPException(
                status_code=400, detail="Password must be at least 8 characters"
            )

        user.password_hash = auth_service.hash_password(new_password)
        db.add(user)
        db.commit()
        db.refresh(user)

        return {"message": "Password updated successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update password")


@router.delete("/auth/delete-account")
def delete_account(
    request: Request,
    response: Response,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete the user and all associated application data."""
    try:
        user_id = user.id

        # Delete all user-related data in order
        # Tables depending on CV
        db.query(JobMatchedHistory).filter(
            JobMatchedHistory.user_id == user_id
        ).delete()
        db.query(UserProfile).filter(UserProfile.user_id == user_id).delete()
        # Tables depending ONLY on user
        db.query(ExternalJob).filter(ExternalJob.user_id == user_id).delete()
        db.query(ChatHistory).filter(ChatHistory.user_id == user_id).delete()
        db.query(JobAction).filter(JobAction.user_id == user_id).delete()
        db.query(JobApplication).filter(JobApplication.user_id == user_id).delete()
        db.query(Notification).filter(Notification.user_id == user_id).delete()
        db.query(JobAlertSettings).filter(JobAlertSettings.user_id == user_id).delete()
        # Then CVs
        db.query(CVDocuments).filter(CVDocuments.user_id == user_id).delete()
        # Delete the user account
        db.delete(user)
        db.commit()

        # Clear the session cookie
        session_id = request.cookies.get("session_id")
        if session_id:
            auth_service.delete_session(session_id)
        response.delete_cookie("session_id")

        return {"message": "Account deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete account")


@router.get("/auth/credits")
def get_credits(
    user=Depends(get_current_user), 
    rate_limit=Depends(get_rate_limit_service)
):
    """Return current remaining credits for the authenticated user."""
    remaining = rate_limit.get_remaining_credits(user.id)
    return {"remaining": remaining}
