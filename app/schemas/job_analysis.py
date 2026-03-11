from pydantic import BaseModel


class JobAnalysisRequest(BaseModel):
    cv_text: str
    job_id: int
