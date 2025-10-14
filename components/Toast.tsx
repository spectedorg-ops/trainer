'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const styles = {
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-400',
    error: 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400',
    info: 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400'
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div
      className="fixed top-4 right-4 z-[100] animate-slide-in-right"
      style={{
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div
        className={`${styles[type]} px-6 py-4 rounded-2xl border-2 shadow-2xl backdrop-blur-xl min-w-[300px] max-w-[400px]`}
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(255,255,255,0.1)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">{icons[type]}</div>
          <div className="flex-1 text-white font-medium">{message}</div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center transition-all"
          >
            ×
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
