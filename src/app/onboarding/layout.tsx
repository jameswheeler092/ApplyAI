export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4">
        <span className="font-semibold text-lg">ApplyAI</span>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {children}
      </div>
    </div>
  )
}
