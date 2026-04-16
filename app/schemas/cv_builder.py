from pydantic import BaseModel


class CVBuildRequest(BaseModel):
    cv_id: int
    job_id: int


class CVBuildSaveRequest(BaseModel):
    cv_id: int
    job_id: int
    updated_text: str
