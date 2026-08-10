"""models.py — shared Pydantic models for the FastAPI backend.

Split out from main.py so storage.py can import Job/JobStatus without
main.py and storage.py importing each other.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class Job(BaseModel):
    job_id: str
    status: JobStatus = JobStatus.QUEUED
    stage: str = "queued"
    progress: float = 0.0
    title: Optional[str] = None
    summary: Optional[str] = None
    transcript: Optional[str] = None
    error: Optional[str] = None
    created_at: str


class JobSummary(BaseModel):
    job_id: str
    title: Optional[str] = None
    status: JobStatus
    stage: str
    created_at: str
    word_count: int = 0
