import { useState } from "react"
import BackgroundGlow from "./components/BackgroundGlow"
import Header from "./components/Header"
import InputPanel from "./components/InputPanel"
import { ApiError, startTranscription } from "./api/client"
import { useJobPolling } from "./hooks/useJobPolling"
import type { StartTranscriptionInput } from "./api/types"

function App() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { job, error: pollError } = useJobPolling(jobId)

  const handleSubmit = async (input: StartTranscriptionInput) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { job_id } = await startTranscription(input)
      setJobId(job_id)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't reach the server. Is the API running?")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col text-gray-100">
      <BackgroundGlow />
      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-16 sm:px-8">
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
          <InputPanel onSubmit={handleSubmit} submitting={submitting} />

          <div className="glass-panel flex min-h-80 flex-1 flex-col items-center justify-center gap-3 p-10 text-center animate-fade-up [animation-delay:100ms]">
            {submitError || pollError ? (
              <p className="max-w-sm text-sm text-red-300">{submitError ?? pollError}</p>
            ) : job ? (
              <>
                <p className="text-sm font-medium text-gray-200">
                  {job.status === "failed" ? "Something went wrong" : "Working on it…"}
                </p>
                <p className="text-xs text-gray-500">
                  stage: {job.stage} · {Math.round(job.progress * 100)}%
                </p>
                {job.error && <p className="max-w-sm text-sm text-red-300">{job.error}</p>}
              </>
            ) : (
              <p className="max-w-xs text-sm text-gray-500">
                Upload a file or paste a YouTube URL, then hit process. Results show up here.
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-8 text-center text-xs text-gray-600 sm:px-8">
        Transcription runs locally. Your audio never leaves this machine.
      </footer>
    </div>
  )
}

export default App
