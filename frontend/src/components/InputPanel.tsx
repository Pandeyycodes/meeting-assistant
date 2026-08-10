import { useRef, useState } from "react"
import { Languages, Link2, Loader2, Sparkles, UploadCloud, X } from "lucide-react"
import type { StartTranscriptionInput } from "../api/types"

type Source = "upload" | "youtube"

const ACCEPTED_TYPES = ".mp3,.wav,.m4a,.webm,.mp4"

interface InputPanelProps {
  onSubmit: (input: StartTranscriptionInput) => void
  submitting: boolean
  disabled?: boolean
}

export default function InputPanel({ onSubmit, submitting, disabled }: InputPanelProps) {
  const [source, setSource] = useState<Source>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [translate, setTranslate] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const locked = submitting || !!disabled
  const canSubmit = !locked && (source === "upload" ? !!file : youtubeUrl.trim().length > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      file: source === "upload" ? (file ?? undefined) : undefined,
      youtubeUrl: source === "youtube" ? youtubeUrl.trim() : undefined,
      translate,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel animate-fade-up flex flex-col gap-5 p-6 sm:p-7">
      <div className="flex gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
        {(["upload", "youtube"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              source === s ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {s === "upload" ? "Upload file" : "YouTube URL"}
          </button>
        ))}
      </div>

      {source === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            if (locked) return
            const dropped = e.dataTransfer.files?.[0]
            if (dropped) setFile(dropped)
          }}
          onClick={() => !locked && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            locked ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          } ${dragActive ? "border-indigo-400/70 bg-indigo-400/5" : "border-white/15 hover:border-white/25"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            disabled={locked}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <UploadCloud className="h-7 w-7 text-indigo-300" strokeWidth={1.75} />
          {file ? (
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <span className="max-w-56 truncate">{file.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
                className="rounded-full p-0.5 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-indigo-300">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">MP3, WAV, M4A, WEBM, MP4</p>
            </>
          )}
        </div>
      ) : (
        <div className="relative">
          <Link2 className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="field pl-10"
            disabled={locked}
          />
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/15 px-4 py-3">
        <span className="flex items-center gap-2 text-sm text-gray-300">
          <Languages className="h-4 w-4 text-gray-500" />
          Translate to English
        </span>
        <span className="relative inline-flex h-5 w-9 items-center">
          <input
            type="checkbox"
            checked={translate}
            onChange={(e) => setTranslate(e.target.checked)}
            className="peer sr-only"
            disabled={locked}
          />
          <span className="absolute inset-0 rounded-full bg-white/15 transition-colors peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-fuchsia-500" />
          <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
        </span>
      </label>

      <button type="submit" disabled={!canSubmit} className="btn-primary w-full">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting…
          </>
        ) : disabled ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Process recording
          </>
        )}
      </button>
    </form>
  )
}
