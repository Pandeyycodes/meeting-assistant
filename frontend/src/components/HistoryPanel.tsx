import { useEffect, useState } from "react"
import { History, Search } from "lucide-react"
import { listJobs } from "../api/client"
import type { JobStatus, JobSummary } from "../api/types"
import { relativeTime } from "../lib/format"

const STATUS_DOT: Record<JobStatus, string> = {
  done: "bg-emerald-400",
  processing: "bg-indigo-400 animate-pulse",
  queued: "bg-indigo-400 animate-pulse",
  failed: "bg-red-400",
}

interface HistoryPanelProps {
  onSelect: (jobId: string) => void
  refreshSignal: number
  activeJobId: string | null
}

export default function HistoryPanel({ onSelect, refreshSignal, activeJobId }: HistoryPanelProps) {
  const [items, setItems] = useState<JobSummary[]>([])
  const [query, setQuery] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    listJobs()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch(() => {
        // history is a nice-to-have; a fetch failure here shouldn't disrupt the main flow
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [refreshSignal])

  if (!loaded || items.length === 0) return null

  const filtered = items.filter((item) =>
    (item.title ?? "Untitled meeting").toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="glass-panel mt-6 flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-200">
        <History className="h-4 w-4 text-gray-500" />
        Recent meetings
      </div>

      {items.length > 4 && (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meetings…"
            className="field py-2 pl-8 text-xs"
          />
        </div>
      )}

      <div className="scroll-thin flex max-h-72 flex-col gap-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-1 py-2 text-xs text-gray-500">No meetings match that search.</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.job_id}
              type="button"
              onClick={() => onSelect(item.job_id)}
              className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                item.job_id === activeJobId ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
              }`}
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[item.status]}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-gray-200">
                  {item.title ?? "Untitled meeting"}
                </span>
                <span className="block text-[11px] text-gray-500">
                  {relativeTime(item.created_at)}
                  {item.word_count > 0 && ` · ${item.word_count.toLocaleString()} words`}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
