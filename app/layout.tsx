import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Training System - Payment Manager',
  description: 'Modern payment tracking system for training management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="main-wrapper">
          <div className="app-container">
            <header style={{marginBottom: '2.5rem'}}>
              <div className="tibia-panel header-glow" style={{padding: '2rem', textAlign: 'center'}}>
                <div className="mb-4">
                  <div className="inline-block text-6xl mb-3">💎</div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-3 tracking-tight">
                  Training Manager
                </h1>
                <p className="text-tibia-light-stone text-base md:text-lg">
                  Sistema de Controle de Pagamentos
                </p>
                <div className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40">
                  <span className="text-2xl">💰</span>
                  <span className="text-yellow-400 font-bold">10,000 GP</span>
                  <span className="text-white/60">por dia</span>
                </div>
              </div>
            </header>
            <main>{children}</main>
            <footer style={{marginTop: '4rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.875rem'}}>
              <p>© 2025 Training System - System by White Widow</p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
}
