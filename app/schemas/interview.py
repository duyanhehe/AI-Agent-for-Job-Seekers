from pydantic import BaseModel
from typing import List


class InterviewRequest(BaseModel):
    cv_id: int
    cv_text: str
    job_id: int


class InterviewAnswerRequest(BaseModel):
    cv_text: str
    job_id: int
    answers: List[dict]
