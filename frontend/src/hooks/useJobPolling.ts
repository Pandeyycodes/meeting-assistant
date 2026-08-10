import { useEffect, useRef, useState } from "react"
import { ApiError, getJob } from "../api/client"
import type { Job } from "../api/types"

const POLL_INTERVAL_MS = 1500

/**
 * Polls GET /jobs/{jobId} while the job is queued/processing and stops once
 * it reaches a terminal state (done/failed) or jobId is cleared.
 */
export function useJobPolling(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setJob(null)
    setError(null)

    if (!jobId) return

    let cancelled = false

    const poll = async () => {
      try {
        const latest = await getJob(jobId)
        if (cancelled) return
        setJob(latest)

        if (latest.status === "queued" || latest.status === "processing") {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : "Lost connection to the server.")
      }
    }

    poll()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [jobId])

  return { job, error }
}
