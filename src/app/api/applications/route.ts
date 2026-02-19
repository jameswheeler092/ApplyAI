import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createApplicationSchema = z.object({
  job_title: z.string().min(1, 'Job title is required'),
  company_name: z.string().min(1, 'Company name is required'),
  job_description: z.string().min(1, 'Job description is required'),
  job_url: z.string().url().optional().or(z.literal('')),
  hiring_manager_name: z.string().optional(),
  documents_requested: z
    .array(z.enum(['research', 'cv', 'cover_letter', 'intro_email']))
    .min(1, 'At least one document type is required'),
  cover_letter_length: z.enum(['short', 'standard', 'detailed']).optional().default('standard'),
  cover_letter_max_words: z.number().int().positive().optional(),
  tone: z.enum(['professional', 'conversational', 'assertive']),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createApplicationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      job_title: parsed.data.job_title,
      company_name: parsed.data.company_name,
      job_description: parsed.data.job_description,
      job_url: parsed.data.job_url || null,
      hiring_manager_name: parsed.data.hiring_manager_name || null,
      documents_requested: parsed.data.documents_requested,
      cover_letter_length: parsed.data.cover_letter_length,
      cover_letter_max_words: parsed.data.cover_letter_max_words ?? null,
      tone: parsed.data.tone,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }

  return NextResponse.json(application, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const applicationStatusFilter = searchParams.get('application_status')

  let query = supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  if (applicationStatusFilter) {
    query = query.eq('application_status', applicationStatusFilter)
  }

  const { data: applications, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }

  return NextResponse.json(applications)
}
