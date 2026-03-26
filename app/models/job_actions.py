from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base


class JobAction(Base):
    __tablename__ = "job_actions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer)

    status = Column(String)  # liked, applied, hidden, reported
    reason = Column(String, nullable=True)
