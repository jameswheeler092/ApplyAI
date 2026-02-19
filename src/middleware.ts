import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/auth/')
  const isOnboarding = pathname.startsWith('/onboarding')
  const isProtectedApp = ['/dashboard', '/apply', '/applications', '/profile', '/settings']
    .some(r => pathname.startsWith(r))

  // Not logged in — block access to app and onboarding routes
  if (!user && (isProtectedApp || isOnboarding)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user) {
    // Fetch onboarding_complete flag only — single lightweight column
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('user_id', user.id)
      .single()

    const onboardingComplete = profile?.onboarding_complete ?? false

    // Onboarding done — redirect away from auth pages and onboarding
    if (onboardingComplete && (isAuthPage || isOnboarding)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Onboarding NOT done — redirect app pages to onboarding
    if (!onboardingComplete && isProtectedApp) {
      return NextResponse.redirect(new URL('/onboarding/step-1', request.url))
    }

    // Onboarding NOT done — redirect auth pages to onboarding
    if (!onboardingComplete && isAuthPage) {
      return NextResponse.redirect(new URL('/onboarding/step-1', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
