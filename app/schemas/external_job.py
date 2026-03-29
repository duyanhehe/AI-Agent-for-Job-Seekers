from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Optional


class ExternalJobCreate(BaseModel):
    title: str
    url: str
    company: str
    location: str
    description: str


class ExternalJobResponse(BaseModel):
    id: int
    job_role: str
    company: str
    location: str
    url: str

    job_type: Optional[str]
    salary: Optional[str]
    work_from_home: Optional[bool]

    skills: List[str] = []
    type_skills: Dict = {}

    is_external: bool = True
