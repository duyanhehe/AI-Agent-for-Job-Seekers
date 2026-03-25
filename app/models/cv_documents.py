from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean
from app.core.database import Base


class CVDocuments(Base):
    __tablename__ = "cv_documents"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String)
    file_name = Column(String)
    content = Column(Text)
    is_primary = Column(Boolean, default=False)
