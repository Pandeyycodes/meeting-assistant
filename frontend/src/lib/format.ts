export function wordCount(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

/** ~130 wpm speaking estimate, mirrors the Streamlit app's calculation. */
export function estimatedMinutes(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 130))
}

export function safeFilename(title: string, fallback = "meeting"): string {
  const base = title.trim() || fallback
  return base.replace(/\s+/g, "_").slice(0, 40)
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60_000)

  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`

  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
