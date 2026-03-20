from app.services.index_manager import IndexManager
from app.core.database import SessionLocal

index_manager = IndexManager()


# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
