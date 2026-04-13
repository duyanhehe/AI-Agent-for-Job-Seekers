import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from app.models.user import User
from app.models.cv_documents import CVDocuments
from app.models.notification import Notification
from app.models.user_profiles import UserProfile


def test_user_crud_operations(db):
    """Test Create, Read, Update, Delete for User model."""
    # Create
    new_user = User(
        email="db_test@example.com", password_hash="secret_hash", role="user"
    )
    db.add(new_user)
    db.commit()
    assert new_user.id is not None

    # Read
    queried_user = db.query(User).filter(User.email == "db_test@example.com").first()
    assert queried_user is not None
    assert queried_user.email == "db_test@example.com"

    # Update
    queried_user.role = "admin"
    db.commit()
    db.refresh(queried_user)
    assert queried_user.role == "admin"

    # Delete
    db.delete(queried_user)
    db.commit()
    deleted_user = db.query(User).filter(User.email == "db_test@example.com").first()
    assert deleted_user is None


def test_user_constraints(db):
    """Test UNIQUE and NOT NULL constraints on User model."""
    # Create initial user
    u1 = User(email="unique_db@example.com", password_hash="h1")
    db.add(u1)
    db.commit()

    # Test UNIQUE constraint
    u2 = User(email="unique_db@example.com", password_hash="h2")
    db.add(u2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

    # Test NOT NULL constraint (email)
    u_null = User(email=None, password_hash="h3")
    db.add(u_null)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_cv_user_relationship_integrity(db):
    """Test relationship between User and CVDocuments."""
    user = User(email="rel_db@example.com", password_hash="h")
    db.add(user)
    db.commit()

    # Add multiple CVs for the same user
    cv1 = CVDocuments(user_id=user.id, file_name="resume_1.pdf", content="C1")
    cv2 = CVDocuments(user_id=user.id, file_name="resume_2.pdf", content="C2")
    db.add_all([cv1, cv2])
    db.commit()

    # Verify we can find all CVs for this user
    user_cvs = db.query(CVDocuments).filter(CVDocuments.user_id == user.id).all()
    assert len(user_cvs) == 2
    assert any(c.file_name == "resume_1.pdf" for c in user_cvs)
    assert any(c.file_name == "resume_2.pdf" for c in user_cvs)


def test_cv_profile_relationship(db):
    """Test relationship between CV and UserProfile."""
    user = User(email="profile_rel@example.com", password_hash="h")
    db.add(user)
    db.commit()

    cv = CVDocuments(user_id=user.id, file_name="cv.pdf", content="text")
    db.add(cv)
    db.commit()

    profile = UserProfile(user_id=user.id, cv_id=cv.id, profile={"skills": ["Test"]})
    db.add(profile)
    db.commit()

    # Verify query by joining
    # relationships() are not defined, use explicit join
    res = (
        db.query(UserProfile, CVDocuments)
        .join(CVDocuments, UserProfile.cv_id == CVDocuments.id)
        .filter(UserProfile.id == profile.id)
        .first()
    )

    assert res is not None
    assert res.UserProfile.profile["skills"] == ["Test"]
    assert res.CVDocuments.file_name == "cv.pdf"
