'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'

export default function Step5Page() {
  const [template, setTemplate] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('cover_letter_template')
        .single()
      if (profile?.cover_letter_template) {
        setTemplate(profile.cover_letter_template)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(value: string | null) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles')
      .update({ cover_letter_template: value })
      .eq('user_id', user!.id)
    router.push('/onboarding/step-6')
  }

  return (
    <OnboardingStepWrapper
      title="Your cover letter"
      description="Write your base cover letter. Claude will adapt it for each role you apply to."
    >
      {/* Framing copy */}
      <p className="text-sm text-gray-600 mb-6">
        Your base cover letter is used as a tone and style reference — not sent as-is. For each application, Claude will rewrite it from scratch, tailored to the specific role and company. Write it as you naturally would; the more authentic the better.
      </p>

      {/* Textarea */}
      <textarea
        value={template}
        onChange={e => setTemplate(e.target.value)}
        placeholder="Write your cover letter here. Think of it as your default — Claude will adapt it for each role you apply to."
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-vertical"
        style={{ minHeight: '300px' }}
      />
      <p className="text-sm text-gray-400 mt-1">{template.length} characters</p>
      <p className="text-xs text-gray-400 mt-0.5">We recommend 300–600 words for best results.</p>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8">
        <Link
          href="/onboarding/step-4"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(null)}
            disabled={loading}
            className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for now
          </button>
          <button
            onClick={() => handleSave(template || null)}
            disabled={loading}
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </OnboardingStepWrapper>
  )
}
