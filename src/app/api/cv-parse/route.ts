import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'A PDF file is required' }, { status: 400 })
  }

  // Upload to Supabase Storage
  const filename = `${Date.now()}-${file.name}`
  const storagePath = `${user.id}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from('cv-uploads')
    .upload(storagePath, file)

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }

  // TODO: POST to n8n CV parse webhook (S2-C5)
  // The n8n workflow will extract structured data from the PDF.
  // For now, return an empty response so the frontend can handle it gracefully.
  const n8nWebhookUrl = process.env.N8N_CV_PARSE_WEBHOOK_URL
  if (n8nWebhookUrl) {
    try {
      const res = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: storagePath, user_id: user.id }),
      })
      if (res.ok) {
        const parsed = await res.json()
        return NextResponse.json(parsed)
      }
    } catch {
      // Fall through to empty response
    }
  }

  // n8n workflow not configured yet — return empty so frontend falls back to manual entry
  return NextResponse.json({ work_history: [] })
}
