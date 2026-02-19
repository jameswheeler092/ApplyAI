import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // TODO: Implement OAuth callback handler
  const url = new URL(request.url)
  return NextResponse.redirect(new URL('/dashboard', url.origin))
}
