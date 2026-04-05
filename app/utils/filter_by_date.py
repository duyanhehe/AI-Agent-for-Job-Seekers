from datetime import datetime, timezone, timedelta


def filter_by_date(jobs, date_filter):
    if not date_filter:
        return jobs

    now = datetime.now(timezone.utc)

    mapping = {
        "24h": timedelta(days=1),
        "3d": timedelta(days=3),
        "week": timedelta(weeks=1),
        "month": timedelta(days=30),
        "year": timedelta(days=365),
    }

    delta = mapping.get(date_filter)
    if not delta:
        return jobs

    filtered = []

    for job in jobs:
        raw_date = job.get("posted_date")

        if not raw_date:
            continue

        try:
            job_date = datetime.strptime(raw_date, "%Y-%m-%d %H:%M:%S")
        except:
            continue

        if now - job_date <= delta:
            filtered.append(job)

    return filtered
