from pydantic import BaseModel


class JobPreference(BaseModel):
    job_function: str
    job_type: str
    location: str
