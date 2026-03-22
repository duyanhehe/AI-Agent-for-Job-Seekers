from sqlalchemy import Column, Integer, ForeignKey, JSON
from app.core.database import Base


class JobMatchedHistory(Base):
    __tablename__ = "job_matched_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    cv_id = Column(Integer, ForeignKey("cv_documents.id"))
    jobs = Column(JSON)
