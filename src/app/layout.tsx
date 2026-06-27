import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MasteryAI — AI-Powered Learning',
  description: 'Master any subject with AI-generated roadmaps, lessons, quizzes, and personalized coaching.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-paper text-ink antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
