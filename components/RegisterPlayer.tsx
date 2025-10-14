'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface RegisterPlayerProps {
  onClose: () => void
  onSuccess: () => void
  currentUser: User
}

export default function RegisterPlayer({ onClose, onSuccess, currentUser }: RegisterPlayerProps) {
  const [characterName, setCharacterName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!characterName.trim()) {
      setError('Por favor, digite o nome do personagem')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Registrar player com timestamp e quem caguetou
      const { error: insertError } = await supabase
        .from('players')
        .insert([{
          character_name: characterName.trim(),
          caguetado_at: new Date().toISOString(),
          caguetado_by_user_id: currentUser.id
        }])

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Este personagem já está registrado')
        } else {
          setError('Erro ao registrar jogador: ' + insertError.message)
        }
        return
      }

      onSuccess()
    } catch (err) {
      setError('Erro inesperado ao registrar jogador')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
      }}
      onClick={onClose}
    >
      <div
        className="tibia-panel p-8 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão X para fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-tibia-gold hover:text-tibia-light-gold transition-colors"
          style={{
            fontSize: '1.5rem',
            lineHeight: '1',
            padding: '0.25rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(203, 166, 125, 0.3)'
          }}
          title="Fechar"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-tibia-gold mb-2 text-center">
          👁️ Caguetar Player 👁️
        </h2>
        <p className="text-tibia-light-stone text-center mb-6 text-sm">
          Reportar jogador que não pagou o treino
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-tibia-light-stone mb-2 text-sm">
              Nome do Personagem
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="w-full tibia-input"
              placeholder="Digite o nome do char"
              disabled={loading}
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-tibia-red bg-opacity-20 border border-tibia-red rounded text-tibia-red text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 tibia-button bg-tibia-stone hover:bg-tibia-light-stone"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 tibia-button"
              disabled={loading}
            >
              {loading ? 'Caguetando...' : 'Caguetar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
