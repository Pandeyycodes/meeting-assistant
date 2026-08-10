import { Waves } from "lucide-react"

export default function EmptyState() {
  return (
    <div className="glass-panel flex w-full max-w-md flex-col items-center gap-3 border-dashed p-10 text-center">
      <Waves className="h-7 w-7 text-gray-600" strokeWidth={1.5} />
      <p className="text-sm text-gray-400">
        Upload a file or paste a YouTube URL, then hit <span className="font-medium text-gray-300">Process recording</span>.
      </p>
      <p className="text-xs text-gray-600">Results — summary, transcript, and Q&A — show up here.</p>
    </div>
  )
}
