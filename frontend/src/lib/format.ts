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
