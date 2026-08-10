import { AlertTriangle } from "lucide-react"

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="glass-panel flex w-full max-w-md flex-col items-center gap-3 border-red-400/20 bg-red-500/[0.04] p-10 text-center">
      <AlertTriangle className="h-7 w-7 text-red-300" strokeWidth={1.5} />
      <p className="text-sm font-medium text-red-200">Something went wrong</p>
      <p className="text-xs text-red-300/80">{message}</p>
    </div>
  )
}
