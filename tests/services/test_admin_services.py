import pytest
from app.services.admin.stats_service import AdminStatsService
from app.models.user import User
from app.models.job_applications import JobApplication
from app.models.cv_documents import CVDocuments


def test_admin_stats_empty(db):
    stats = AdminStatsService.get_stats(db)
    assert stats["total_users"] == 0
    assert stats["total_applications"] == 0


def test_admin_stats_populated(db):
    # Add some data
    u = User(email="test@admin.com", password_hash="hash")
    db.add(u)
    db.commit()

    cv = CVDocuments(user_id=u.id, file_name="cv.pdf", content="text")
    db.add(cv)
    db.commit()

    app = JobApplication(
        user_id=u.id, job_id="1", status="prepared", job_title="Dev", company="TC"
    )
    db.add(app)
    db.commit()

    stats = AdminStatsService.get_stats(db)
    assert stats["total_users"] == 1
    assert stats["total_cvs"] == 1
    assert stats["total_applications"] == 1
