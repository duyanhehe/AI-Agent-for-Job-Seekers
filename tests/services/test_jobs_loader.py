import pytest
from app.services.jobs.jobs_dataset_loader import parse_list, parse_type_skills


def test_parse_list_none():
    assert parse_list(None) == []


def test_parse_list_list():
    assert parse_list(["Python", "FastAPI"]) == ["python", "fastapi"]


def test_parse_list_string_representation():
    # Test ast.literal_eval path
    assert parse_list("['SQL', 'NoSQL']") == ["sql", "nosql"]


def test_parse_list_csv_string():
    # Test fallback split path
    assert parse_list("Git, Docker, Kubernetes") == ["git", "docker", "kubernetes"]


def test_parse_list_mixed_case():
    assert parse_list(["PyThOn", "fastAPI"]) == ["python", "fastapi"]


def test_parse_type_skills_none():
    assert parse_type_skills(None) == {}


def test_parse_type_skills_dict():
    data = {"prog": ["python"], "db": ["sql"]}
    assert parse_type_skills(data) == data


def test_parse_type_skills_string_dict():
    raw = "{'libraries': ['pandas', 'numpy']}"
    assert parse_type_skills(raw) == {"libraries": ["pandas", "numpy"]}


def test_parse_type_skills_string_list():
    raw = "['git', 'bash']"
    assert parse_type_skills(raw) == {"other": ["git", "bash"]}


def test_parse_type_skills_fallback():
    assert parse_type_skills("python, sql") == {"other": ["python", "sql"]}
