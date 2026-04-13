import pytest
import unittest.mock as mock
from app.services.jobs.index_manager import IndexManager


@pytest.fixture
def sample_jobs():
    return [
        {
            "job_function": "Backend",
            "job_role": "Python Developer",
            "company": "TechCorp",
            "location": "Remote",
            "country": "United States",
            "job_type": "Full-time",
            "work_from_home": True,
            "salary": 100000,
            "skills": ["python", "fastapi"],
            "type_skills": {"prog": ["python"], "backend": ["fastapi"]},
        },
        {
            "job_function": "Frontend",
            "job_role": "React Developer",
            "company": "DesignCo",
            "location": "Singapore",
            "country": "Singapore",
            "job_type": "Contract",
            "work_from_home": False,
            "salary": 80000,
            "skills": ["react", "javascript"],
            "type_skills": {"ui": ["react"]},
        },
    ]


@pytest.fixture
def index_manager(sample_jobs):
    with mock.patch(
        "app.services.jobs.index_manager.load_jobs", return_value=sample_jobs
    ):
        manager = IndexManager()
        # Mock the index and retriever to avoid real Chroma calls in this unit test
        manager.index = mock.MagicMock()
        manager.jobs_data = sample_jobs
        return manager


def test_get_job_functions(index_manager):
    functions = index_manager.get_job_functions()
    assert functions == ["Backend", "Frontend"]


def test_match_jobs_country_match(index_manager, sample_jobs):
    # Mock retrieve_similar_jobs to return both jobs
    with mock.patch.object(
        index_manager, "retrieve_similar_jobs", return_value=sample_jobs
    ):
        result = index_manager.matchJobs(
            text="I am a python fan",
            skills=["python"],
            job_function="Backend",
            job_type="Full-time",
            location="United States",
        )

        # Should match United States job first
        assert len(result["jobs"]) > 0
        assert result["jobs"][0]["country"] == "United States"
        assert result["warning"] is None


def test_match_jobs_country_mismatch_warning(index_manager, sample_jobs):
    with mock.patch.object(
        index_manager, "retrieve_similar_jobs", return_value=sample_jobs
    ):
        result = index_manager.matchJobs(
            text="python",
            skills=["python"],
            job_function="Backend",
            job_type="Full-time",
            location="Vietnam",  # No jobs in Vietnam
        )

        assert result["warning"] is not None
        assert "no jobs listed in the country you selected" in result["warning"]
        # Should still return jobs from other countries
        assert len(result["jobs"]) > 0


def test_skill_overlap_scoring(index_manager, sample_jobs):
    with mock.patch.object(
        index_manager, "retrieve_similar_jobs", return_value=sample_jobs
    ):
        # CV with python skills should score higher for job 0
        # Passing location=None to avoid country filtering in this test
        result = index_manager.matchJobs(
            text="python fastapi",
            skills=["python", "fastapi"],
            job_function="Backend",
            job_type="Full-time",
            location=None,
        )

        job_0 = next(j for j in result["jobs"] if j["job_role"] == "Python Developer")
        job_1 = next(j for j in result["jobs"] if j["job_role"] == "React Developer")

        assert job_0["score"] > job_1["score"]


def test_empty_skills_handling(index_manager, sample_jobs):
    with mock.patch.object(
        index_manager, "retrieve_similar_jobs", return_value=sample_jobs
    ):
        result = index_manager.matchJobs(
            text="something",
            skills=None,  # Edge case: skills is None
            job_function="Backend",
            job_type="Full-time",
            location=None,  # No location to keep both jobs
        )
        assert "jobs" in result
        assert len(result["jobs"]) == 2
