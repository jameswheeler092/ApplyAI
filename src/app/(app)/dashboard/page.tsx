import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RecentApplicationsStrip } from '@/components/dashboard/RecentApplicationsStrip'
import { ProfileNudge } from '@/components/dashboard/ProfileNudge'
import { FREE_TIER_LIMIT } from '@/lib/constants'

type CompletenessIssue = {
  label: string
  href: string
}

function getCompletenessIssues(profile: {
  headline: string | null
  work_history: unknown
  skills_experiences: unknown
  cover_letter_template: string | null
  target_roles: string[] | null
  target_industries: string[] | null
} | null): CompletenessIssue[] {
  const issues: CompletenessIssue[] = []
  if (!profile?.headline) {
    issues.push({ label: 'Add a professional headline', href: '/profile' })
  }
  if (!Array.isArray(profile?.work_history) || !profile.work_history.length) {
    issues.push({ label: 'Add your work history', href: '/profile/cv' })
  }
  if (!Array.isArray(profile?.skills_experiences) || !profile.skills_experiences.length) {
    issues.push({ label: 'Add your skills and experience narratives', href: '/profile/skills' })
  }
  if (!profile?.cover_letter_template) {
    issues.push({ label: 'Add your base cover letter', href: '/profile/cover-letter' })
  }
  if (!profile?.target_roles?.length && !profile?.target_industries?.length) {
    issues.push({ label: 'Set your job preferences and tone', href: '/profile/preferences' })
  }
  return issues
}

function GenerateCTA() {
  return (
    <div className="bg-blue-600 rounded-xl p-6 text-white">
      <h2 className="text-xl font-semibold mb-1">Generate documents for a new role</h2>
      <p className="text-blue-100 text-sm mb-4">
        Paste a job description and get a tailored CV, cover letter, company research, and intro email.
      </p>
      <Link
        href="/apply"
        className="inline-flex items-center gap-2 bg-white text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
      >
        Start →
      </Link>
    </div>
  )
}

function UsageIndicator({ used, limit }: { used: number; limit: number }) {
  const atLimit = used >= limit
  return (
    <div className={`rounded-lg border p-4 ${atLimit ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
      <p className="text-sm text-gray-500">Applications this month</p>
      <p className={`text-2xl font-semibold ${atLimit ? 'text-amber-600' : 'text-gray-900'}`}>
        {used} <span className="text-base font-normal text-gray-400">/ {limit}</span>
      </p>
      {atLimit && (
        <Link href="/settings/billing" className="text-xs text-amber-600 underline mt-1 block">
          Upgrade for unlimited
        </Link>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch profile — select only fields needed for completeness check and greeting
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, headline, work_history, skills_experiences, cover_letter_template, target_roles, target_industries')
    .eq('user_id', user.id)
    .single()

  // Fetch usage for current month
  const period = new Date()
  period.setDate(1)
  const periodStr = period.toISOString().split('T')[0]

  const { data: usage } = await supabase
    .from('usage')
    .select('applications_generated')
    .eq('user_id', user.id)
    .eq('period', periodStr)
    .single()

  // Fetch total application count
  const { count: totalApplications } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const usageCount = usage?.applications_generated ?? 0
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const completenessIssues = getCompletenessIssues(profile)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ProfileNudge issues={completenessIssues} />
      <h1 className="text-2xl font-semibold mb-6">Good morning, {firstName} 👋</h1>
      <GenerateCTA />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <UsageIndicator used={usageCount} limit={FREE_TIER_LIMIT} />
        <StatCard label="Total applications" value={totalApplications ?? 0} />
      </div>
      <div className="mt-8">
        <RecentApplicationsStrip />
      </div>
    </div>
  )
}
