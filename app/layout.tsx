import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { ProjectsProvider } from './context/ProjectsContext'
import ThemeProvider from './components/ThemeProvider'

export const metadata: Metadata = {
  title: 'UniStart Hub',
  description: 'UniStart Hub - Startup ideas platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz">
      <body>
        <AuthProvider>
          <ProjectsProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </ProjectsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}