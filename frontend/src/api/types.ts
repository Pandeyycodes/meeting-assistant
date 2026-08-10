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
  created_at: string
}

export interface JobSummary {
  job_id: string
  title: string | null
  status: JobStatus
  stage: string
  created_at: string
  word_count: number
}

export interface StartTranscriptionInput {
  youtubeUrl?: string
  file?: File
  translate: boolean
}
