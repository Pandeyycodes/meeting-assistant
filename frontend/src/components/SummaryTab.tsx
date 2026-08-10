import ReactMarkdown from "react-markdown"

export default function SummaryTab({ summary }: { summary: string | null }) {
  if (!summary) {
    return <p className="p-6 text-sm text-gray-500">No summary available.</p>
  }

  return (
    <div
      className="prose-invert scroll-thin max-h-[28rem] overflow-y-auto p-6 text-sm leading-relaxed text-gray-200
        [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white
        [&_h3]:font-semibold [&_h3]:text-white [&_strong]:text-white [&_strong]:font-semibold
        [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_p]:my-2"
    >
      <ReactMarkdown>{summary}</ReactMarkdown>
    </div>
  )
}
