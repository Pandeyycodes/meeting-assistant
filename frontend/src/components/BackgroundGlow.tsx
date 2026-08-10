export default function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas">
      <div className="absolute -top-40 left-1/4 h-[32rem] w-[32rem] animate-glow rounded-full bg-indigo-500/25 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] animate-glow rounded-full bg-fuchsia-500/20 blur-[120px] [animation-delay:2s]" />
      <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] animate-glow rounded-full bg-violet-500/15 blur-[120px] [animation-delay:4s]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  )
}
