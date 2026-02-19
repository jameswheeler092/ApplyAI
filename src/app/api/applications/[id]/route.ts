import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Fetch application — RLS ensures user can only fetch their own
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (appError || !application) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Fetch all document versions — return only the latest version per type
  const { data: allDocuments } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', id)
    .order('version', { ascending: false })

  // Deduplicate — keep only the highest version per document type
  const latestDocuments = allDocuments
    ? Object.values(
        allDocuments.reduce((acc, doc) => {
          if (!acc[doc.type] || doc.version > acc[doc.type].version) {
            acc[doc.type] = doc
          }
          return acc
        }, {} as Record<string, typeof allDocuments[0]>)
      )
    : []

  return NextResponse.json({ application, documents: latestDocuments })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validStatuses = ['saved', 'applied', 'interview', 'offer', 'rejected']
  if (body.application_status && !validStatuses.includes(body.application_status as string)) {
    return NextResponse.json({ error: 'Invalid application_status value' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.application_status !== undefined) updates.application_status = body.application_status
  if (body.notes !== undefined) updates.notes = body.notes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, application_status, notes, updated_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found or update failed' }, { status: 404 })
  }

  return NextResponse.json(data)
}
