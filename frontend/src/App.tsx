import { useEffect, useState } from "react"
import BackgroundGlow from "./components/BackgroundGlow"
import Header from "./components/Header"
import InputPanel from "./components/InputPanel"
import ProgressView from "./components/ProgressView"
import ResultsView from "./components/ResultsView"
import EmptyState from "./components/EmptyState"
import ErrorBanner from "./components/ErrorBanner"
import HistoryPanel from "./components/HistoryPanel"
import { ApiError, startTranscription } from "./api/client"
import { useJobPolling } from "./hooks/useJobPolling"
import type { StartTranscriptionInput } from "./api/types"

function App() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  const { job, error: pollError } = useJobPolling(jobId)
  const isActive = job?.status === "queued" || job?.status === "processing"

  // Refresh the history list once a job reaches a terminal state, so its
  // title/word count/status dot in the sidebar reflects the final result.
  useEffect(() => {
    if (job?.status === "done" || job?.status === "failed") {
      setHistoryVersion((v) => v + 1)
    }
  }, [job?.status])

  const handleSubmit = async (input: StartTranscriptionInput) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { job_id } = await startTranscription(input)
      setJobId(job_id)
      setHistoryVersion((v) => v + 1)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't reach the server. Is the API running?")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setJobId(null)
    setSubmitError(null)
  }

  const handleSelectHistory = (id: string) => {
    setJobId(id)
    setSubmitError(null)
  }

  return (
    <div className="flex min-h-screen flex-col text-gray-100">
      <BackgroundGlow />
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-16 sm:px-8">
        <div className="mb-8 animate-fade-up">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Drop in a recording, get back{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              answers
            </span>
            .
          </h2>
          <p className="mt-2 max-w-xl text-sm text-gray-400 sm:text-base">
            Local Whisper transcription, a grounded summary, and a Q&A you can trust — nothing invented.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-1 items-start gap-6 lg:grid-cols-[22rem_1fr]">
          <div className="lg:sticky lg:top-8">
            <InputPanel onSubmit={handleSubmit} submitting={submitting} disabled={isActive} />
            <HistoryPanel onSelect={handleSelectHistory} refreshSignal={historyVersion} activeJobId={jobId} />
          </div>

          <div className="flex min-h-80 flex-1 flex-col items-center justify-center animate-fade-up [animation-delay:100ms]">
            {submitError || pollError ? (
              <ErrorBanner message={submitError ?? pollError ?? ""} onRetry={handleReset} />
            ) : job?.status === "failed" ? (
              <ErrorBanner message={job.error ?? "The pipeline failed unexpectedly."} onRetry={handleReset} />
            ) : job && job.status !== "done" ? (
              <ProgressView job={job} />
            ) : job?.status === "done" ? (
              <ResultsView job={job} onReset={handleReset} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-8 text-center text-xs text-gray-600 sm:px-8">
        Transcription runs locally. Your audio never leaves this machine.
      </footer>
    </div>
  )
}

export default App
