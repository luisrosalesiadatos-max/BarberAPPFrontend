import { NextResponse, NextRequest } from 'next/server'

const AUTH_PAGES = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API proxy requests go straight through — auth is handled by the backend
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get('access_token')?.value
  const isAuthPage = AUTH_PAGES.some(p => pathname.startsWith(p))

  // Redirect unauthenticated users to login
  if (!isAuthPage && !accessToken) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from login/register
  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL('/agenda', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.svg|.*\\.ico).*)',
  ],
}
