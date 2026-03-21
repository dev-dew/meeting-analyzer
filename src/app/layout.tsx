import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'H+ Meeting Analyzer | Hotel Plus',
  description: 'Meeting Performance Measurement & Termination Warning System for H+ Hotel Plus',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
