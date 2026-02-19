'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GenerationStatusBadge } from '@/components/ui/GenerationStatusBadge'
import { ApplicationStatusBadge } from '@/components/ui/ApplicationStatusBadge'
import type { GenerationStatus, ApplicationStatus } from '@/types'

interface RecentApplication {
  id: string
  job_title: string
  company_name: string
  status: GenerationStatus
  application_status: ApplicationStatus
  created_at: string
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
  const months = Math.floor(diffDays / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="flex items-center gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-14" />
      </div>
    </div>
  )
}

export function RecentApplicationsStrip() {
  const [applications, setApplications] = useState<RecentApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/applications?limit=5')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        setApplications(data.applications)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
        <Link href="/applications" className="text-sm text-blue-600 hover:text-blue-800">
          View all
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && (error || applications.length === 0) && (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-500">
            No applications yet.{' '}
            <Link href="/apply" className="text-blue-600 hover:text-blue-800 font-medium">
              Generate your first →
            </Link>
          </p>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => (
            <Link
              key={app.id}
              href={`/applications/${app.id}`}
              className="block rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{app.company_name}</p>
                  <p className="text-sm text-gray-500 truncate">{app.job_title}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {formatRelativeDate(app.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <GenerationStatusBadge status={app.status} />
                <ApplicationStatusBadge status={app.application_status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
