import type { Metadata, Viewport } from 'next'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider }  from '@/providers/AuthProvider'
import { Toaster }       from '@/components/ui/toaster'

export const metadata: Metadata = {
  title:       'BarberíaApp',
  description: 'Sistema de gestión para barberías',
  manifest:    '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'BarberíaApp' },
}

export const viewport: Viewport = {
  themeColor:     '#d97706',
  width:          'device-width',
  initialScale:   1,
  maximumScale:   1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
