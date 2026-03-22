from sqlalchemy import Column, Integer, String, ForeignKey, Text
from app.core.database import Base


class CVDocuments(Base):
    __tablename__ = "cv_documents"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String)
    content = Column(Text)
