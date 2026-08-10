import type { Job, JobSummary, StartTranscriptionInput } from "./types"

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body?.detail === "string") return body.detail
  } catch {
    // response wasn't JSON — fall through to the status text below
  }
  return res.statusText || `Request failed with status ${res.status}`
}

export async function startTranscription(input: StartTranscriptionInput): Promise<{ job_id: string }> {
  const form = new FormData()
  if (input.youtubeUrl) form.set("youtube_url", input.youtubeUrl)
  if (input.file) form.set("file", input.file)
  form.set("translate", String(input.translate))

  const res = await fetch(`${API_URL}/transcribe`, { method: "POST", body: form })
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res))
  return res.json()
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`)
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res))
  return res.json()
}

export async function listJobs(limit = 50): Promise<JobSummary[]> {
  const res = await fetch(`${API_URL}/jobs?limit=${limit}`)
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res))
  return res.json()
}

export async function askQuestion(jobId: string, question: string): Promise<{ answer: string }> {
  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, question }),
  })
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res))
  return res.json()
}

export type ExportFormat = "txt" | "pdf"

export async function downloadExport(jobId: string, format: ExportFormat, filenameHint: string): Promise<void> {
  const res = await fetch(`${API_URL}/export/${jobId}?format=${format}`)
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res))

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filenameHint}.${format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}
