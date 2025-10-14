'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface CheckInButtonProps {
  playerId: string
  playerName: string
  currentUser: User
  alreadyCheckedIn: boolean
  onSuccess: () => void
}

export default function CheckInButton({
  playerId,
  playerName,
  currentUser,
  alreadyCheckedIn,
  onSuccess
}: CheckInButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleCheckIn() {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('check_ins')
        .insert([{
          reporter_id: currentUser.id,
          player_id: playerId,
          check_in_date: new Date().toISOString().split('T')[0]
        }])

      if (error) {
        if (error.code === '23505') {
          alert('Você já fez check-in deste player hoje')
        } else {
          alert('Erro ao fazer check-in: ' + error.message)
        }
        return
      }

      onSuccess()
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (currentUser.character_name === playerName) {
    return null // Não pode fazer check-in de si mesmo
  }

  return (
    <button
      onClick={handleCheckIn}
      disabled={loading || alreadyCheckedIn}
      className={`tibia-button text-sm py-2 px-4 ${
        alreadyCheckedIn ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? '⏳ Enviando...' : alreadyCheckedIn ? '✓ Check-in Feito' : '👁️ Está Treinando'}
    </button>
  )
}
