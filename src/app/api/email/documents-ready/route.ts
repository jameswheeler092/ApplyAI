import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDocumentsReadyEmail } from '@/lib/email'

export async function POST(request: Request) {
  // Verify the request comes from n8n using a shared secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.N8N_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user_id, application_id } = await request.json()

  const supabase = createAdminClient()

  // Fetch user email
  const { data: { user } } = await supabase.auth.admin.getUserById(user_id)
  if (!user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Fetch profile and application
  const [{ data: profile }, { data: application }] = await Promise.all([
    supabase.from('profiles').select('full_name, email_notifications').eq('user_id', user_id).single(),
    supabase.from('applications').select('job_title, company_name').eq('id', application_id).single(),
  ])

  if (!profile || !application) {
    return NextResponse.json({ error: 'Data not found' }, { status: 404 })
  }

  if (!profile.email_notifications) {
    return NextResponse.json({ message: 'Notifications disabled, skipping' })
  }

  await sendDocumentsReadyEmail({
    to: user.email,
    userName: profile.full_name ?? 'there',
    jobTitle: application.job_title,
    companyName: application.company_name,
    applicationId: application_id,
  })

  return NextResponse.json({ message: 'Email sent' })
}
