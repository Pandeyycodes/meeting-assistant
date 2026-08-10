import { AudioWaveform, Brain, Database, Download, Loader2, Scissors, Sparkles } from "lucide-react"
import type { Job } from "../api/types"

const STAGES: { key: string; label: string; icon: typeof Download }[] = [
  { key: "downloading", label: "Downloading audio", icon: Download },
  { key: "converting", label: "Converting to WAV", icon: AudioWaveform },
  { key: "chunking", label: "Splitting into chunks", icon: Scissors },
  { key: "transcribing", label: "Transcribing with Whisper", icon: Sparkles },
  { key: "summarizing", label: "Summarizing with Mistral", icon: Brain },
  { key: "indexing", label: "Building the Q&A index", icon: Database },
]

function currentStage(stage: string) {
  return STAGES.find((s) => s.key === stage)
}

export default function ProgressView({ job }: { job: Job }) {
  const active = currentStage(job.stage)
  const Icon = active?.icon ?? Loader2
  const percent = Math.round(job.progress * 100)

  return (
    <div className="glass-panel animate-fade-up flex w-full max-w-md flex-col items-center gap-6 p-10 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20">
        <Icon className="h-6 w-6 text-indigo-300" strokeWidth={1.75} />
        <span className="absolute inset-0 animate-glow rounded-2xl bg-indigo-400/20 blur-md" />
      </div>

      <div>
        <p className="text-base font-semibold text-white">{active?.label ?? "Getting started…"}</p>
        <p className="mt-1 text-xs text-gray-500">
          {job.stage === "transcribing" ? "This is the slow step — hang tight." : "Won't take long."}
        </p>
      </div>

      <div className="w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 bg-[length:200%_100%] transition-[width] duration-500 ease-out animate-shimmer"
            style={{ width: `${Math.max(percent, 4)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{STAGES.findIndex((s) => s.key === job.stage) + 1 || 1} / {STAGES.length}</span>
          <span>{percent}%</span>
        </div>
      </div>
    </div>
  )
}
