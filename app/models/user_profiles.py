from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.ext.mutable import MutableDict
from app.core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    cv_id = Column(Integer, ForeignKey("cv_documents.id"))

    profile = Column(MutableDict.as_mutable(JSON))
