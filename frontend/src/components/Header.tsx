import { AudioLines, ExternalLink } from "lucide-react"

export default function Header() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-8 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-[0_4px_20px_-4px_rgba(129,140,248,0.6)]">
          <AudioLines className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">Meeting Assistant</h1>
          <p className="text-xs text-gray-400">Transcribe · Summarize · Ask</p>
        </div>
      </div>

      <a
        href="https://github.com/Pandeyycodes/meeting-assistant"
        target="_blank"
        rel="noreferrer"
        className="chip transition-colors hover:border-white/25 hover:text-white"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Source</span>
      </a>
    </header>
  )
}
