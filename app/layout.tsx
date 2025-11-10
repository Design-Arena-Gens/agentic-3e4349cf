import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payroll Sheet',
  description: 'Simple payroll calculator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 md:p-8">
          {children}
        </div>
      </body>
    </html>
  )
}
