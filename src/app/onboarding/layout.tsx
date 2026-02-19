import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg">ApplyAI</span>
      </header>
      <OnboardingProgress />
      <div className="max-w-2xl mx-auto px-4 py-10">
        {children}
      </div>
    </div>
  )
}
