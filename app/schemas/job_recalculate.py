from pydantic import BaseModel


class JobRecalculateRequest(BaseModel):
    cv_id: int
    cv_text: str
    job_function: str | None = None
    job_type: str | None = None
    location: str | None = None
    date_filter: str | None = None
