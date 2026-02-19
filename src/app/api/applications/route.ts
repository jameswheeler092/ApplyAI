import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type CreateApplicationPayload, type DocumentType } from '@/types'

const FREE_TIER_LIMIT = 5

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  let body: CreateApplicationPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'validation_error', message: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.job_title || !body.company_name || !body.job_description || !body.documents_requested?.length) {
    return NextResponse.json({ error: 'validation_error', message: 'Missing required fields' }, { status: 400 })
  }

  // 3. Check usage limit
  const admin = createAdminClient()
  const period = new Date()
  period.setDate(1)
  const periodStr = period.toISOString().split('T')[0] // 'YYYY-MM-01'

  const { data: usage } = await admin
    .from('usage')
    .select('applications_generated')
    .eq('user_id', user.id)
    .eq('period', periodStr)
    .single()

  const tier = 'free' // hardcoded for MVP — all users are free tier
  const usageCount = usage?.applications_generated ?? 0

  if (tier === 'free' && usageCount >= FREE_TIER_LIMIT) {
    return NextResponse.json({
      error: 'usage_limit_reached',
      message: `You have used all ${FREE_TIER_LIMIT} free applications this month. Upgrade to Pro for unlimited applications.`,
    }, { status: 402 })
  }

  // 4. Create application record
  const { data: application, error: appError } = await admin
    .from('applications')
    .insert({
      user_id: user.id,
      job_title: body.job_title,
      company_name: body.company_name,
      job_description: body.job_description,
      job_url: body.job_url ?? null,
      hiring_manager_name: body.hiring_manager_name ?? null,
      documents_requested: body.documents_requested,
      cover_letter_length: body.cover_letter_length ?? 'standard',
      cover_letter_max_words: body.cover_letter_max_words ?? null,
      tone: body.tone,
      status: 'pending',
      application_status: 'saved',
    })
    .select('id')
    .single()

  if (appError || !application) {
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }

  // 5. Create pending document rows (one per requested document type)
  const documentRows = body.documents_requested.map((type: DocumentType) => ({
    application_id: application.id,
    user_id: user.id,
    type,
    status: 'pending',
    version: 1,
  }))

  await admin.from('documents').insert(documentRows)

  // 6. Increment usage counter (upsert)
  await admin.from('usage').upsert({
    user_id: user.id,
    period: periodStr,
    applications_generated: usageCount + 1,
  }, { onConflict: 'user_id,period' })

  // 7. Fire n8n webhook (async — do not await full completion)
  const webhookUrl = process.env.N8N_GENERATION_WEBHOOK_URL
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({
        application_id: application.id,
        user_id: user.id,
      }),
    }).catch(err => console.error('n8n webhook fire failed:', err))
  }

  // 8. Return application ID immediately
  return NextResponse.json({ application_id: application.id }, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '25'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const applicationStatus = searchParams.get('application_status')
  const documentStatus = searchParams.get('document_status')

  let query = supabase
    .from('applications')
    .select('id, job_title, company_name, status, application_status, documents_requested, created_at, updated_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (applicationStatus) query = query.eq('application_status', applicationStatus)
  if (documentStatus) query = query.eq('status', documentStatus)

  const { data: applications, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }

  return NextResponse.json({
    applications: applications ?? [],
    total: count ?? 0,
    has_more: (offset + limit) < (count ?? 0),
  })
}
