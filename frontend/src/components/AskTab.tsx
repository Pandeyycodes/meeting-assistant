import { useState } from "react"
import { Loader2, Send, Sparkles } from "lucide-react"
import { ApiError, askQuestion } from "../api/client"

interface QA {
  question: string
  answer: string
}

export default function AskTab({ jobId }: { jobId: string }) {
  const [question, setQuestion] = useState("")
  const [history, setHistory] = useState<QA[]>([])
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (!q || asking) return

    setAsking(true)
    setError(null)
    try {
      const { answer } = await askQuestion(jobId, q)
      setHistory((prev) => [...prev, { question: q, answer }])
      setQuestion("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server.")
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="scroll-thin max-h-[24rem] min-h-[8rem] overflow-y-auto p-6">
        {history.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Answers come only from this transcript — ask about decisions, action items, anything discussed.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((qa, i) => (
              <div key={i} className="flex flex-col gap-2">
                <p className="self-end rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-sm">
                  {qa.question}
                </p>
                <p className="self-start rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm leading-relaxed text-gray-200">
                  {qa.answer}
                </p>
              </div>
            ))}
          </div>
        )}
        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      </div>

      <form onSubmit={handleAsk} className="flex items-center gap-2 border-t border-white/10 p-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What were the action items?"
          className="field"
          disabled={asking}
        />
        <button type="submit" disabled={asking || !question.trim()} className="btn-primary shrink-0 px-4">
          {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}
