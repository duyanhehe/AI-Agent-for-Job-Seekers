import uuid
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.user import User
from app.core.redis import redis_client
from app.config import SESSION_EXPIRE_SECONDS


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class AuthService:
    def hash_password(self, password: str):
        return pwd_context.hash(password)

    def verify_password(self, plain, hashed):
        return pwd_context.verify(plain, hashed)

    def create_user(self, db: Session, email: str, password: str):
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return None

        user = User(email=email, password_hash=self.hash_password(password))

        try:
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            raise

        return user

    def authenticate_user(self, db: Session, email: str, password: str):
        user = db.query(User).filter(User.email == email).first()

        if not user:
            return None

        if not self.verify_password(password, user.password_hash):
            return None

        return user

    def create_session(self, user_id: int):
        session_id = str(uuid.uuid4())

        redis_client.setex(f"session:{session_id}", SESSION_EXPIRE_SECONDS, user_id)

        return session_id

    def get_user_from_session(self, session_id: str):
        return redis_client.get(f"session:{session_id}")

    def delete_session(self, session_id: str):
        redis_client.delete(f"session:{session_id}")
