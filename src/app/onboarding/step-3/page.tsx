'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type EducationEntry, type CertificationEntry } from '@/types'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'

function newEducation(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    institution: '',
    degree: '',
    subject: '',
    startDate: '',
    endDate: null,
  }
}

function newCertification(): CertificationEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    issuer: '',
    year: new Date().getFullYear(),
  }
}

export default function Step3Page() {
  const [education, setEducation] = useState<EducationEntry[]>([newEducation()])
  const [certifications, setCertifications] = useState<CertificationEntry[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('education, certifications')
        .single()
      if (profile?.education && Array.isArray(profile.education) && profile.education.length > 0) {
        setEducation(profile.education as unknown as EducationEntry[])
      }
      if (profile?.certifications && Array.isArray(profile.certifications) && profile.certifications.length > 0) {
        setCertifications(profile.certifications as unknown as CertificationEntry[])
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateEducation(id: string, updates: Partial<EducationEntry>) {
    setEducation(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  function removeEducation(id: string) {
    setEducation(prev => prev.filter(e => e.id !== id))
  }

  function updateCertification(id: string, updates: Partial<CertificationEntry>) {
    setCertifications(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  function removeCertification(id: string) {
    setCertifications(prev => prev.filter(c => c.id !== id))
  }

  async function handleSave() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles')
      .update({
        education: JSON.parse(JSON.stringify(education)),
        certifications: JSON.parse(JSON.stringify(certifications)),
      })
      .eq('user_id', user!.id)
    router.push('/onboarding/step-4')
  }

  return (
    <OnboardingStepWrapper
      title="Education & certifications"
      description="Add your academic background and any relevant certifications."
    >
      {/* Education Section */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-3">Education</h2>
        <div className="space-y-4">
          {education.map((entry, index) => (
            <div key={entry.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Education {index + 1}</span>
                {education.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(entry.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution name</label>
                  <input
                    type="text"
                    value={entry.institution}
                    onChange={(e) => updateEducation(entry.id, { institution: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                  <input
                    type="text"
                    placeholder="e.g. BSc, MA, PhD"
                    value={entry.degree}
                    onChange={(e) => updateEducation(entry.id, { degree: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject / field of study</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={entry.subject}
                    onChange={(e) => updateEducation(entry.id, { subject: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                  <input
                    type="month"
                    value={entry.startDate}
                    onChange={(e) => updateEducation(entry.id, { startDate: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                  {entry.endDate !== null ? (
                    <input
                      type="month"
                      value={entry.endDate ?? ''}
                      onChange={(e) => updateEducation(entry.id, { endDate: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="month"
                      disabled
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                    />
                  )}
                  <label className="flex items-center gap-2 mt-1.5">
                    <input
                      type="checkbox"
                      checked={entry.endDate === null}
                      onChange={(e) => updateEducation(entry.id, { endDate: e.target.checked ? null : '' })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-600">Currently studying</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setEducation(prev => [...prev, newEducation()])}
          className="mt-3 w-full rounded-md border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Add education
        </button>
      </section>

      {/* Certifications Section */}
      <section className="mt-10">
        <h2 className="text-lg font-medium text-gray-900 mb-1">Certifications</h2>
        <p className="text-sm text-gray-500 mb-3">Optional — add any relevant professional certifications.</p>
        <div className="space-y-4">
          {certifications.map((cert, index) => (
            <div key={cert.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Certification {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeCertification(cert.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certification name</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Solutions Architect"
                    value={cert.name}
                    onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuing organisation</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Services"
                    value={cert.issuer}
                    onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder={String(new Date().getFullYear())}
                    value={cert.year}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                      updateCertification(cert.id, { year: parseInt(val) || 0 })
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCertifications(prev => [...prev, newCertification()])}
          className="mt-3 w-full rounded-md border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Add certification
        </button>
      </section>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8">
        <Link
          href="/onboarding/step-2"
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
