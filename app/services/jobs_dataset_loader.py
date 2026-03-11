import ast
from datasets import load_dataset


def parse_list(raw):

    if raw is None:
        return []

    if isinstance(raw, list):
        return [str(s).lower() for s in raw]

    if isinstance(raw, str):
        try:
            parsed = ast.literal_eval(raw)

            if isinstance(parsed, list):
                return [str(s).lower() for s in parsed]

            if isinstance(parsed, dict):
                return parsed

        except Exception:
            return [s.strip().lower() for s in raw.split(",")]

    return []


def parse_type_skills(raw):

    if raw is None:
        return {}

    if isinstance(raw, dict):
        return raw

    if isinstance(raw, str):
        try:
            parsed = ast.literal_eval(raw)

            if isinstance(parsed, dict):
                return parsed

            if isinstance(parsed, list):
                return {"other": parsed}

        except Exception:
            return {"other": [s.strip().lower() for s in raw.split(",")]}

    return {}


def load_jobs():

    dataset = load_dataset("lukebarousse/data_jobs", split="train[:5000]")

    jobs = []

    for row in dataset:
        skills = parse_list(row.get("job_skills"))
        type_skills = parse_type_skills(row.get("job_type_skills"))

        jobs.append(
            {
                "job_function": row.get("job_title_short", ""),
                "job_role": row.get("job_title", ""),
                "company": row.get("company_name", ""),
                "location": row.get("job_location", "Unknown"),
                "job_type": row.get("job_schedule_type", ""),
                "salary": row.get("salary_year_avg", None),
                "skills": skills,
                "type_skills": type_skills,
            }
        )

    return jobs
