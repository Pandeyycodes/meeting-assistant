"""storage.py — SQLite persistence for job records.

The Chroma vector store already persists itself to disk per job_id
(see rag.py, ./chroma_db/{job_id}); this covers the job metadata
(status, title, summary, transcript) so meeting history survives a
server restart.
"""

import sqlite3
from contextlib import contextmanager

from models import Job, JobStatus

DB_PATH = "meetings.db"


@contextmanager
def _connect():
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                stage TEXT NOT NULL,
                progress REAL NOT NULL,
                title TEXT,
                summary TEXT,
                transcript TEXT,
                error TEXT,
                created_at TEXT NOT NULL
            )
            """
        )


def save_job(job: Job) -> None:
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO jobs (job_id, status, stage, progress, title, summary, transcript, error, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
                status = excluded.status,
                stage = excluded.stage,
                progress = excluded.progress,
                title = excluded.title,
                summary = excluded.summary,
                transcript = excluded.transcript,
                error = excluded.error
            """,
            (
                job.job_id,
                job.status.value,
                job.stage,
                job.progress,
                job.title,
                job.summary,
                job.transcript,
                job.error,
                job.created_at,
            ),
        )


def load_all_jobs() -> dict[str, Job]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT job_id, status, stage, progress, title, summary, transcript, error, created_at FROM jobs"
        ).fetchall()

    jobs: dict[str, Job] = {}
    for job_id, status, stage, progress, title, summary, transcript, error, created_at in rows:
        job = Job(
            job_id=job_id,
            status=JobStatus(status),
            stage=stage,
            progress=progress,
            title=title,
            summary=summary,
            transcript=transcript,
            error=error,
            created_at=created_at,
        )
        jobs[job.job_id] = job
    return jobs
