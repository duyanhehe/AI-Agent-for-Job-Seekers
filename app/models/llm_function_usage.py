from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime, timezone
from app.core.database import Base


class LLMFunctionUsage(Base):
    __tablename__ = "llm_function_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Name of the LLM function called
    function_name = Column(String)
    # credits_spent: 1 = match_cv_to_job/extract_profile/answer_job_question
    #              2 = generate_cover_letter
    #              3 = generate_interview/grade_interview
    credits_spent = Column(Integer)

    # Gemini Token Usage
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
