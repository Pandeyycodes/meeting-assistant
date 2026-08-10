import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { ApiError, downloadExport, type ExportFormat } from "../api/client"
import { safeFilename } from "../lib/format"

export default function ExportBar({ jobId, title }: { jobId: string; title: string | null }) {
  const [pending, setPending] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setPending(format)
    setError(null)
    try {
      await downloadExport(jobId, format, safeFilename(title ?? "meeting"))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export failed.")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-white/10 p-4">
      <div className="flex gap-2">
        {(["txt", "pdf"] as const).map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => handleExport(format)}
            disabled={pending !== null}
            className="btn-secondary flex-1"
          >
            {pending === format ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Download .{format}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  )
}
