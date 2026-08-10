import { useState } from "react"
import { FileText, MessageCircleQuestion, ScrollText } from "lucide-react"
import type { Job } from "../api/types"
import { estimatedMinutes, wordCount } from "../lib/format"
import SummaryTab from "./SummaryTab"
import TranscriptTab from "./TranscriptTab"
import AskTab from "./AskTab"
import ExportBar from "./ExportBar"

type Tab = "summary" | "transcript" | "ask"

const TABS: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: "summary", label: "Summary", icon: FileText },
  { key: "transcript", label: "Transcript", icon: ScrollText },
  { key: "ask", label: "Ask", icon: MessageCircleQuestion },
]

export default function ResultsView({ job }: { job: Job }) {
  const [tab, setTab] = useState<Tab>("summary")
  const transcript = job.transcript ?? ""

  return (
    <div className="glass-panel animate-fade-up flex w-full flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/10 p-6">
        <h3 className="text-lg font-bold text-white">{job.title ?? "Meeting"}</h3>
        <div className="flex flex-wrap gap-2">
          <span className="chip">{wordCount(transcript).toLocaleString()} words</span>
          <span className="chip">~{estimatedMinutes(transcript)} min</span>
          <span className="chip border-emerald-400/25 text-emerald-300">Q&A ready</span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-white/10 px-4 pt-3">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "border-b-2 border-indigo-400 text-white"
                : "border-b-2 border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "summary" && <SummaryTab summary={job.summary} />}
      {tab === "transcript" && <TranscriptTab transcript={job.transcript} />}
      {tab === "ask" && <AskTab jobId={job.job_id} />}

      <ExportBar jobId={job.job_id} title={job.title} />
    </div>
  )
}
