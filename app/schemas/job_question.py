from pydantic import BaseModel


class JobQuestionRequest(BaseModel):
    cv_text: str
    job_id: int
    question: str
