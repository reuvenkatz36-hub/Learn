import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { LANG_COOKIE, normalizeLang, dirFor } from '@/lib/i18n'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zendric — AI-Powered Learning',
  description: 'Master any subject with AI-generated courses, lessons, quizzes, and personalized coaching.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = normalizeLang(cookies().get(LANG_COOKIE)?.value)
  const dir = dirFor(lang)

  return (
    <html lang={lang} dir={dir}>
      <head>
        {/* Hebrew UI + reader fonts (quality match for Inter / Georgia) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;500;600;700;800&family=Frank+Ruhl+Libre:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} bg-paper text-ink antialiased`} data-lang={lang}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
