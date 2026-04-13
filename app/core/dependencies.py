from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.services.jobs.index_manager import IndexManager
from app.services.auth.auth_service import AuthService
from app.services.documents.document_reader import DocumentReader
from app.services.llm.llm_service import LLMService
from app.services.auth.rate_limit_service import RateLimitService
from app.core.database import SessionLocal
from app.models.user import User


# Global service instances
index_manager = IndexManager()
auth_service = AuthService()
llm_service = LLMService(index_manager)
rate_limit_service = RateLimitService()


# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Get current user
def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    session_id = request.cookies.get("session_id")

    if not session_id:
        raise HTTPException(status_code=401, detail="Not logged in")

    user_id = auth_service.get_user_from_session(session_id)

    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired")

    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# Requires admin role
def require_admin(user):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


# Service dependencies
def get_reader():
    return DocumentReader()


def get_index_manager():
    return index_manager


def get_llm_service():
    return llm_service


def get_rate_limit_service():
    return rate_limit_service
