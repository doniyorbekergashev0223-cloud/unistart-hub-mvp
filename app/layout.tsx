import type { Metadata, Viewport } from 'next'
import './styles/tokens.css'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { ProjectsProvider } from './context/ProjectsContext'
import { LocaleProvider } from './context/LocaleContext'
import ThemeProvider from './components/ThemeProvider'
import SkipToMain from './components/SkipToMain'

export const metadata: Metadata = {
  title: 'UniStart Hub — Startap loyihalari platformasi',
  description:
    'UniStart Hub — talabalar, universitetlar va Yoshlar ishlari agentligi uchun startap loyihalarini boshqarish va kuzatish platformasi. Loyiha yuborish, ko\'rib chiqish va qaror qabul qilish jarayonini qog\'ozsiz va shaffof qiladi.',
  openGraph: {
    title: 'UniStart Hub — Startap loyihalari platformasi',
    description:
      'Talabalar, universitetlar va yoshlar uchun startap loyihalarini boshqarish va kuzatish platformasi.',
    locale: 'uz',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fef7ed',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <LocaleProvider>
            <SkipToMain />
            <ProjectsProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </ProjectsProvider>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  )
}