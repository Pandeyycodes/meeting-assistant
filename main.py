
"""
main.py — FastAPI backend for the Meeting Assistant.

Wraps the same pipeline app.py uses (audio_processor -> transcriber ->
Summerize -> rag -> exporter) behind an HTTP API so a separate frontend
can drive it. See PLAN.md Phase 1.
"""

import os
import uuid
from enum import Enum
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from audio_processor import chunk_audio, convert_to_wav, download_youttube_audio
from rag import answer_question, build_qa_chain, build_vectorstore, load_vectorstore
from Summerize import generate_title, summarize
from transcriber import transcribe_all
from exporter import export_pdf, export_txt

app = FastAPI(title="Meeting Assistant API")

DEFAULT_FRONTEND_ORIGINS = "http://localhost:5173,http://localhost:3000"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGIN", DEFAULT_FRONTEND_ORIGINS).split(",")
        if origin.strip()
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# In-memory job store: fine for a single-process dev/portfolio deployment.
# A restart or a second worker process would need Redis/a DB instead.
jobs: dict[str, Job] = {}


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/health")
def health():
    return {"status": "ok"}


def run_pipeline(job_id: str, youtube_url: Optional[str], upload_path: Optional[str], translate: bool) -> None:
    """Runs the full pipeline for one job, writing progress into jobs[job_id] as it goes.

    Executed as a background task so /transcribe can return job_id immediately —
    the YouTube download and Whisper transcription are both slow.
    """
    job = jobs[job_id]
    try:
        job.status = JobStatus.PROCESSING

        if youtube_url:
            job.stage, job.progress = "downloading", 0.05
            audio_path = download_youttube_audio(youtube_url)
        else:
            audio_path = upload_path

        job.stage, job.progress = "converting", 0.15
        wav_path = convert_to_wav(audio_path, audio_path)

        job.stage, job.progress = "chunking", 0.30
        chunks = chunk_audio(wav_path)

        job.stage, job.progress = "transcribing", 0.45
        transcript = transcribe_all(chunks, translate=translate)
        job.transcript = transcript

        job.stage, job.progress = "summarizing", 0.75
        job.summary = summarize(transcript)
        job.title = generate_title(transcript)

        job.stage, job.progress = "indexing", 0.90
        build_vectorstore(transcript, job_id=job_id)

        job.stage, job.progress, job.status = "done", 1.0, JobStatus.DONE
    except Exception as e:
        job.status = JobStatus.FAILED
        job.error = str(e)


@app.post("/transcribe")
async def transcribe(
    background_tasks: BackgroundTasks,
    youtube_url: Optional[str] = Form(None),
    translate: bool = Form(False),
    file: Optional[UploadFile] = File(None),
):
    if not youtube_url and not file:
        raise HTTPException(400, "Provide either youtube_url or file")

    job_id = uuid.uuid4().hex
    jobs[job_id] = Job(job_id=job_id)

    upload_path = None
    if file:
        upload_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
        with open(upload_path, "wb") as f:
            f.write(await file.read())

    background_tasks.add_task(run_pipeline, job_id, youtube_url, upload_path, translate)
    return {"job_id": job_id}


@app.get("/jobs/{job_id}", response_model=Job)
def get_job(job_id: str):
    job = jobs.get(job_id)
    if job is None:
        raise HTTPException(404, "job not found")
    return job


class AskRequest(BaseModel):
    job_id: str
    question: str


# Cache built QA chains per job_id — the retriever/LLM wiring is cheap to
# reuse and reloading Chroma + the embedding model for every question would
# add unnecessary latency.
qa_chains: dict = {}


@app.post("/ask")
def ask(req: AskRequest):
    job = jobs.get(req.job_id)
    if job is None:
        raise HTTPException(404, "job not found")
    if job.status != JobStatus.DONE:
        raise HTTPException(409, "job is not done yet")

    chain = qa_chains.get(req.job_id)
    if chain is None:
        vectorstore = load_vectorstore(req.job_id)
        chain = build_qa_chain(vectorstore)
        qa_chains[req.job_id] = chain

    answer = answer_question(chain, req.question)
    return {"answer": answer}


@app.get("/export/{job_id}")
def export(job_id: str, format: str = "txt"):
    job = jobs.get(job_id)
    if job is None:
        raise HTTPException(404, "job not found")
    if job.status != JobStatus.DONE:
        raise HTTPException(409, "job is not done yet")
    if format not in ("txt", "pdf"):
        raise HTTPException(400, "format must be txt or pdf")

    title = job.title or "Meeting"
    safe_name = title.replace(" ", "_")[:40]

    if format == "txt":
        content = export_txt(title, job.summary or "", job.transcript or "")
        return Response(
            content=content.encode("utf-8"),
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.txt"'},
        )

    content = export_pdf(title, job.summary or "", job.transcript or "")
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.pdf"'},
    )
