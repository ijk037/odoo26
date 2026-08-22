import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'HRMS — Manipal University Jaipur',
    template: '%s | HRMS MUJ',
  },
  description:
    'Workflow-driven Human Resource Management System for Manipal University Jaipur — manage employees, attendance, tasks, leave, and salary.',
  keywords: ['HRMS', 'HR Management', 'Attendance', 'Manipal University Jaipur'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
