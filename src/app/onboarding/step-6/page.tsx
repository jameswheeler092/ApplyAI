'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type Tone } from '@/types'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'
import { TagInput } from '@/components/ui/TagInput'

const CULTURE_SUGGESTIONS = [
  'Remote-first',
  'Mission-driven',
  'High-growth',
  'Collaborative',
  'Autonomous',
  'Innovative',
  'Diverse & Inclusive',
]

const TONE_OPTIONS: { value: Tone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal, polished, and authoritative. Best for corporate or senior roles.' },
  { value: 'conversational', label: 'Conversational', description: 'Warm, approachable, and natural. Best for startups or creative roles.' },
  { value: 'assertive', label: 'Assertive', description: 'Confident, direct, and results-focused. Best for competitive or leadership roles.' },
]

export default function Step6Page() {
  const [targetIndustries, setTargetIndustries] = useState<string[]>([])
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [cultureValues, setCultureValues] = useState<string[]>([])
  const [careerAspirations, setCareerAspirations] = useState('')
  const [hobbiesInterests, setHobbiesInterests] = useState('')
  const [preferredTone, setPreferredTone] = useState<Tone>('professional')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_industries, target_roles, culture_values, career_aspirations, hobbies_interests, preferred_tone')
        .single()
      if (profile) {
        if (Array.isArray(profile.target_industries) && profile.target_industries.length > 0) {
          setTargetIndustries(profile.target_industries)
        }
        if (Array.isArray(profile.target_roles) && profile.target_roles.length > 0) {
          setTargetRoles(profile.target_roles)
        }
        if (Array.isArray(profile.culture_values) && profile.culture_values.length > 0) {
          setCultureValues(profile.culture_values)
        }
        if (profile.career_aspirations) {
          setCareerAspirations(profile.career_aspirations)
        }
        if (profile.hobbies_interests) {
          setHobbiesInterests(profile.hobbies_interests)
        }
        if (profile.preferred_tone) {
          setPreferredTone(profile.preferred_tone as Tone)
        }
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles')
      .update({
        target_industries: targetIndustries,
        target_roles: targetRoles,
        culture_values: cultureValues,
        career_aspirations: careerAspirations || null,
        hobbies_interests: hobbiesInterests || null,
        preferred_tone: preferredTone,
        onboarding_complete: true,
      })
      .eq('user_id', user!.id)
    router.push('/dashboard')
  }

  return (
    <OnboardingStepWrapper
      title="Preferences & tone"
      description="Help us understand the kinds of roles you're targeting and how you'd like to come across."
    >
      <div className="space-y-6">
        {/* Target Industries */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target industries</label>
          <TagInput
            value={targetIndustries}
            onChange={setTargetIndustries}
            placeholder="e.g. Fintech, SaaS, Healthcare"
          />
        </div>

        {/* Target Roles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target roles</label>
          <TagInput
            value={targetRoles}
            onChange={setTargetRoles}
            placeholder="e.g. Product Manager, Software Engineer"
          />
        </div>

        {/* Culture Values */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Culture values</label>
          <TagInput
            value={cultureValues}
            onChange={setCultureValues}
            placeholder="e.g. Remote-first, Collaborative"
            suggestions={CULTURE_SUGGESTIONS}
          />
        </div>

        {/* Career Aspirations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Career aspirations</label>
          <textarea
            value={careerAspirations}
            onChange={e => setCareerAspirations(e.target.value)}
            placeholder="Where do you want to be in 3–5 years?"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-vertical"
            style={{ minHeight: '100px' }}
          />
        </div>

        {/* Hobbies & Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hobbies & interests</label>
          <input
            type="text"
            value={hobbiesInterests}
            onChange={e => setHobbiesInterests(e.target.value)}
            placeholder="Used to add personality to cover letters"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Default Tone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Default tone</label>
          <div className="space-y-3">
            {TONE_OPTIONS.map(option => (
              <label
                key={option.value}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  preferredTone === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  value={option.value}
                  checked={preferredTone === option.value}
                  onChange={() => setPreferredTone(option.value)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8">
        <Link
          href="/onboarding/step-5"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </Link>
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Finish'}
        </button>
      </div>
    </OnboardingStepWrapper>
  )
}
