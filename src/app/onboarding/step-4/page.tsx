'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type SkillNarrativeEntry } from '@/types'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'

function newEntry(): SkillNarrativeEntry {
  return { id: crypto.randomUUID(), skill: '', narrative: '' }
}

export default function Step4Page() {
  const [entries, setEntries] = useState<SkillNarrativeEntry[]>([newEntry(), newEntry()])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('skills_experiences')
        .single()
      if (profile?.skills_experiences && Array.isArray(profile.skills_experiences) && profile.skills_experiences.length > 0) {
        setEntries(profile.skills_experiences as unknown as SkillNarrativeEntry[])
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function addEntry() {
    setEntries(prev => [...prev, newEntry()])
  }

  function removeEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function updateEntry(id: string, updates: Partial<SkillNarrativeEntry>) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  async function handleSave() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles')
      .update({ skills_experiences: JSON.parse(JSON.stringify(entries)) })
      .eq('user_id', user!.id)
    router.push('/onboarding/step-5')
  }

  return (
    <OnboardingStepWrapper
      title="Skills & experience"
      description="Tell us about the skills you want to highlight. Specific examples produce significantly better documents."
    >
      {/* Framing copy */}
      <p className="text-sm text-gray-600 mb-6">
        These narratives are how we personalise your documents. The more specific you are — real projects, real outcomes, real numbers — the better your CV and cover letter will be. You can always add more from your profile later.
      </p>

      {/* Entry blocks */}
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Skill {index + 1}</span>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill / competency</label>
                <input
                  type="text"
                  placeholder="e.g. Stakeholder Management, Python, Data Analysis"
                  value={entry.skill}
                  onChange={(e) => updateEntry(entry.id, { skill: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe a time you demonstrated this skill</label>
                <textarea
                  placeholder="e.g. Led cross-functional alignment across 5 teams to ship a payments feature that increased conversion by 12%..."
                  value={entry.narrative}
                  onChange={(e) => updateEntry(entry.id, { narrative: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-vertical"
                  style={{ minHeight: '120px' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add skill button */}
      <button
        type="button"
        onClick={addEntry}
        className="mt-3 w-full rounded-md border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Add another skill
      </button>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8">
        <Link
          href="/onboarding/step-3"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </Link>
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </OnboardingStepWrapper>
  )
}
