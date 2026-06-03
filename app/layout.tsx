import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-context'

export const metadata: Metadata = {
  title: 'RankLens — SEO & GEO Audit Tool',
  description: 'Comprehensive SEO and Generative Engine Optimization audit for any website. Get ranked on Google and AI platforms.',
  keywords: ['SEO audit', 'GEO audit', 'AI search optimization', 'website analysis', 'site score'],
  openGraph: {
    title: 'RankLens — SEO & GEO Audit Tool',
    description: 'Audit your website for Google and AI search visibility in seconds.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
