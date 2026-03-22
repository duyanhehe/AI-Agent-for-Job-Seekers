from sqlalchemy import Column, Integer, ForeignKey, Text
from app.core.database import Base


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer)
    question = Column(Text)
    answer = Column(Text)
