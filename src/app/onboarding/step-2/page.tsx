'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type WorkHistoryEntry } from '@/types'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'

function newEntry(): WorkHistoryEntry {
  return {
    id: crypto.randomUUID(),
    company: '',
    title: '',
    startDate: '',
    endDate: null,
    employmentType: 'full-time',
    bullets: [],
  }
}

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
] as const

export default function Step2Page() {
  const [entries, setEntries] = useState<WorkHistoryEntry[]>([newEntry()])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('work_history')
        .single()
      if (profile?.work_history && Array.isArray(profile.work_history) && profile.work_history.length > 0) {
        setEntries(profile.work_history as unknown as WorkHistoryEntry[])
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

  function updateEntry(id: string, updates: Partial<WorkHistoryEntry>) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  // Drag-and-drop reorder
  function handleDragStart(id: string) {
    setDraggedId(id)
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    setDragOverId(id)
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    setEntries(prev => {
      const fromIndex = prev.findIndex(e => e.id === draggedId)
      const toIndex = prev.findIndex(e => e.id === targetId)
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
    setDraggedId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverId(null)
  }

  // PDF upload
  async function handleFileUpload(file: File) {
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file.')
      return
    }
    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/cv-parse', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to parse CV')
      }

      const parsed = await res.json()
      if (parsed.work_history && Array.isArray(parsed.work_history) && parsed.work_history.length > 0) {
        const mapped: WorkHistoryEntry[] = parsed.work_history.map((entry: Partial<WorkHistoryEntry>) => ({
          ...newEntry(),
          ...entry,
          id: crypto.randomUUID(),
        }))
        setEntries(mapped)
      }
    } catch {
      setUploadError('Failed to read your CV. You can still enter your details manually below.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles')
      .update({ work_history: JSON.parse(JSON.stringify(entries)) })
      .eq('user_id', user!.id)
    router.push('/onboarding/step-3')
  }

  return (
    <OnboardingStepWrapper
      title="Your work history"
      description="Add your employment history. You can also upload your existing CV to auto-fill."
    >
      {/* PDF Upload Zone */}
      <div className="mb-8">
        <label
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          {uploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
              <span className="text-sm text-gray-600">Reading your CV...</span>
            </>
          ) : (
            <>
              <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Upload your existing CV to auto-fill (PDF)</span>
              <span className="text-xs text-gray-400 mt-1">Click to browse or drag and drop</span>
            </>
          )}
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
            disabled={uploading}
          />
        </label>
        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      {/* Work History Entries */}
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            draggable
            onDragStart={() => handleDragStart(entry.id)}
            onDragOver={(e) => handleDragOver(e, entry.id)}
            onDrop={() => handleDrop(entry.id)}
            onDragEnd={handleDragEnd}
            className={`rounded-lg border p-4 transition-colors ${
              dragOverId === entry.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
            } ${draggedId === entry.id ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="cursor-grab text-gray-400" title="Drag to reorder">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-gray-700">Role {index + 1}</span>
              </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company name *</label>
                <input
                  type="text"
                  value={entry.company}
                  onChange={(e) => updateEntry(entry.id, { company: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job title *</label>
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment type</label>
                <select
                  value={entry.employmentType}
                  onChange={(e) => updateEntry(entry.id, { employmentType: e.target.value as WorkHistoryEntry['employmentType'] })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {EMPLOYMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                <input
                  type="month"
                  value={entry.startDate}
                  onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                {entry.endDate !== null ? (
                  <input
                    type="month"
                    value={entry.endDate ?? ''}
                    onChange={(e) => updateEntry(entry.id, { endDate: e.target.value })}
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
                    onChange={(e) => updateEntry(entry.id, { endDate: e.target.checked ? null : '' })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-600">I currently work here</span>
                </label>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Achievements</label>
              <textarea
                rows={4}
                value={entry.bullets.join('\n')}
                onChange={(e) => updateEntry(entry.id, { bullets: e.target.value.split('\n') })}
                placeholder="One achievement per line. Be specific — these become bullet points in your CV."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">One achievement per line. Be specific — these become bullet points in your CV.</p>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="mt-4 w-full rounded-md border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Add another role
      </button>

      <div className="flex items-center justify-between pt-8">
        <Link
          href="/onboarding/step-1"
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
