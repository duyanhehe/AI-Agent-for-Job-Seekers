from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, JSON
from app.core.database import Base


class JobAlertSettings(Base):
    __tablename__ = "job_alert_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, index=True, unique=True
    )
    enabled = Column(Boolean, default=True)
    cv_id = Column(Integer, nullable=True)  # Primary CV ID for matching
    match_quality_threshold = Column(Float, default=80.0)  # 60, 80, or 100 for "All"
    notification_frequency = Column(
        String, default="instant"
    )  # "instant", "daily", "weekly"
    keywords = Column(JSON, default=[])  # ["React", "AI", "Backend", ...]
