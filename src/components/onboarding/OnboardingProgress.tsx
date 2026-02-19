'use client'

import { usePathname } from 'next/navigation'

const STEPS = [
  { step: 1, label: 'Personal Details' },
  { step: 2, label: 'Work History' },
  { step: 3, label: 'Education' },
  { step: 4, label: 'Skills' },
  { step: 5, label: 'Cover Letter' },
  { step: 6, label: 'Preferences' },
]

export function OnboardingProgress() {
  const pathname = usePathname()
  const currentStep = parseInt(pathname.split('step-')[1]) || 1

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="border-b px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Step {currentStep} of {STEPS.length}</span>
          <span>{STEPS[currentStep - 1]?.label}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full">
          <div
            className="h-1.5 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
