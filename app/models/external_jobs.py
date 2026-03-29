from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from app.core.database import Base


class ExternalJob(Base):
    __tablename__ = "external_jobs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String)
    company = Column(String)
    location = Column(String)
    url = Column(String)
    description = Column(Text)

    job_type = Column(String)
    salary = Column(String)
    work_from_home = Column(Boolean, default=False)

    skills = Column(JSON)
    type_skills = Column(JSON)

    job_function = Column(String)
