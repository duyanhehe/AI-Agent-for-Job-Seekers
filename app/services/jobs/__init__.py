"""Job dataset loading and vector index for matching."""

from app.services.jobs.index_manager import IndexManager
from app.services.jobs.jobs_dataset_loader import load_jobs

__all__ = ["IndexManager", "load_jobs"]
