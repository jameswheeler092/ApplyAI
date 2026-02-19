'use client'

import { useState } from 'react'
import Link from 'next/link'

type CompletenessIssue = {
  label: string
  href: string
}

export function ProfileNudge({ issues }: { issues: CompletenessIssue[] }) {
  const [dismissed, setDismissed] = useState(false)
  if (!issues.length || dismissed) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-800">
            Complete your profile for better results
          </p>
          <p className="text-sm text-amber-700 mt-0.5">
            Missing sections reduce document quality.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 text-lg leading-none flex-shrink-0"
        >
          ×
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        {issues.map((issue) => (
          <li key={issue.href}>
            <Link
              href={issue.href}
              className="text-sm text-amber-700 underline hover:text-amber-900"
            >
              → {issue.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
