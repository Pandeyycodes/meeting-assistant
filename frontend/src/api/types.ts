export type JobStatus = "queued" | "processing" | "done" | "failed"

export interface Job {
  job_id: string
  status: JobStatus
  stage: string
  progress: number
  title: string | null
  summary: string | null
  transcript: string | null
  error: string | null
}

export interface StartTranscriptionInput {
  youtubeUrl?: string
  file?: File
  translate: boolean
}
