'use client'

import { useState, useEffect } from 'react'
import { supabase, SkillHistory } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface SkillHistoryListProps {
  user: User
  onClose: () => void
}

export default function SkillHistoryList({ user, onClose }: SkillHistoryListProps) {
  const [history, setHistory] = useState<SkillHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    try {
      const { data, error } = await supabase
        .from('skill_history')
        .select(`
          id,
          user_id,
          sword_level,
          sword_percent,
          club_level,
          club_percent,
          axe_level,
          axe_percent,
          distance_level,
          distance_percent,
          shielding_level,
          shielding_percent,
          magic_level,
          magic_percent,
          recorded_at
        `)
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Determinar quais skills mostrar baseado na vocação
  const showMelee = user.vocation === 'EK'
  const showDistance = user.vocation === 'RP'
  const showShielding = user.vocation === 'EK'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="tibia-panel p-8 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-tibia-gold mb-2 text-center">
          📜 Histórico de Skills 📜
        </h2>
        <p className="text-tibia-light-stone text-center text-sm mb-6">
          {user.character_name}
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto mb-3" style={{margin: '0 auto 0.75rem'}}></div>
            <div className="text-tibia-light-stone">Carregando histórico...</div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-tibia-light-stone">
              Nenhum registro de skill ainda
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {history.map((record) => (
              <div key={record.id} className="tibia-panel p-4 border-tibia-stone">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-tibia-gold font-semibold mb-2">
                      📅 {formatDate(record.recorded_at)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {showMelee && record.melee_level !== null && (
                        <div className="text-tibia-light-stone">
                          ⚔️ Melee: <span className="text-tibia-gold font-semibold">
                            {record.melee_level}
                            {record.melee_percent !== null && ` (${record.melee_percent}%)`}
                          </span>
                        </div>
                      )}
                      {showDistance && record.distance_level !== null && (
                        <div className="text-tibia-light-stone">
                          🏹 Distance: <span className="text-tibia-gold font-semibold">
                            {record.distance_level}
                            {record.distance_percent !== null && ` (${record.distance_percent}%)`}
                          </span>
                        </div>
                      )}
                      {showShielding && record.shielding_level !== null && (
                        <div className="text-tibia-light-stone">
                          🛡️ Shielding: <span className="text-tibia-gold font-semibold">
                            {record.shielding_level}
                            {record.shielding_percent !== null && ` (${record.shielding_percent}%)`}
                          </span>
                        </div>
                      )}
                      {record.magic_level !== null && (
                        <div className="text-tibia-light-stone">
                          ✨ Magic Level: <span className="text-tibia-gold font-semibold">
                            {record.magic_level}
                            {record.magic_percent !== null && ` (${record.magic_percent}%)`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="tibia-button px-8"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
