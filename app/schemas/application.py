from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class ApplicationPrepareRequest(BaseModel):
    job_id: str
    job_title: str
    company: str
    job_description: Optional[str] = ""
    job_url: Optional[str] = None
    cv_id: int
    tone: str = "engineering"


class ApplicationCreateRequest(BaseModel):
    job_id: str
    job_title: str
    company: str
    job_url: Optional[str] = None
    status: str  # draft, submitted
    autofill_data: Dict[str, Any]
    cover_letter: str
    tone: str


class ApplicationResponse(BaseModel):
    id: int
    job_id: str
    job_title: str
    company: str
    job_url: Optional[str] = None
    status: str
    autofill_data: Dict[str, Any]
    cover_letter: str
    tone: str
    applied_at: datetime

    class Config:
        from_attributes = True
