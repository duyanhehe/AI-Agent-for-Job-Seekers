from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime
from datetime import datetime, timezone
from app.core.database import Base


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Snapshot of job details
    job_id = Column(String)  # Reference to external job or internal identifier
    job_title = Column(String)
    company = Column(String)
    job_url = Column(String, nullable=True)  # Link to external job portal

    status = Column(String, default="draft")  # draft, submitted

    # Snapshot of data used for this application
    autofill_data = Column(JSON)  # {name, email, phone, skills, experience}
    cover_letter = Column(Text)
    tone = Column(String)  # engineering, sales

    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
