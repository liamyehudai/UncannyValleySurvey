import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Uncanny Valley Survey',
  description: 'A survey about robot realism',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/survey1">Survey 1 (Realism)</Link>
          <Link href="/survey2">Survey 2 (Preference)</Link>
          <Link href="/analytics">Analytics</Link>
        </nav>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  )
}
