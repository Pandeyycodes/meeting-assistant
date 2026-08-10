import BackgroundGlow from "./components/BackgroundGlow"
import Header from "./components/Header"

function App() {
  return (
    <div className="flex min-h-screen flex-col text-gray-100">
      <BackgroundGlow />
      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-16 sm:px-8">
        <div className="mb-8 animate-fade-up">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Drop in a recording, get back{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              answers
            </span>
            .
          </h2>
          <p className="mt-2 max-w-xl text-sm text-gray-400 sm:text-base">
            Local Whisper transcription, a grounded summary, and a Q&A you can trust — nothing invented.
          </p>
        </div>

        <div className="glass-panel flex flex-1 items-center justify-center border-dashed p-16 text-center text-sm text-gray-500 animate-fade-up [animation-delay:100ms]">
          Frontend shell ready — input form lands next.
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-8 text-center text-xs text-gray-600 sm:px-8">
        Transcription runs locally. Your audio never leaves this machine.
      </footer>
    </div>
  )
}

export default App
