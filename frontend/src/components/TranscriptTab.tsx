export default function TranscriptTab({ transcript }: { transcript: string | null }) {
  if (!transcript) {
    return <p className="p-6 text-sm text-gray-500">No transcript available.</p>
  }

  return (
    <div className="scroll-thin max-h-[28rem] overflow-y-auto p-6">
      <p className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-gray-300">{transcript}</p>
    </div>
  )
}
