'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface PlayersListProps {
  onClose: () => void
  currentUser: User
}

interface PlayerWithPayments {
  id: string
  character_name: string
  total_payments: number
  total_paid: number
  last_payment_date: string | null
  paid_today: boolean
}

export default function PlayersList({ onClose, currentUser }: PlayersListProps) {
  const [players, setPlayers] = useState<PlayerWithPayments[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayers()
  }, [])

  async function loadPlayers() {
    try {
      const { data, error } = await supabase
        .from('player_activity')
        .select('*')
        .order('character_name')

      if (error) throw error

      // Calcular total pago (cada pagamento = 10k)
      const playersWithTotals = (data || []).map(p => ({
        ...p,
        total_paid: p.total_payments * 10000
      }))

      setPlayers(playersWithTotals)
    } catch (error) {
      console.error('Erro ao carregar players:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`
    }
    return value.toString()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const totalPlayers = players.length
  const totalPayments = players.reduce((sum, p) => sum + p.total_payments, 0)
  const totalRevenue = totalPayments * 10000

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
      }}
    >
      <div className="tibia-panel p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-tibia-gold mb-2 text-center">
          👥 Lista Completa de Players 👥
        </h2>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="tibia-panel p-4 text-center border-tibia-stone">
            <div className="text-3xl font-bold text-tibia-gold mb-1">
              {totalPlayers}
            </div>
            <div className="text-tibia-light-stone text-sm">
              Players Cadastrados
            </div>
          </div>
          <div className="tibia-panel p-4 text-center border-tibia-stone">
            <div className="text-3xl font-bold text-tibia-green mb-1">
              {totalPayments}
            </div>
            <div className="text-tibia-light-stone text-sm">
              Pagamentos Total
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto mb-3" style={{margin: '0 auto 0.75rem'}}></div>
            <div className="text-tibia-light-stone">Carregando players...</div>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-tibia-light-stone">
              Nenhum player cadastrado ainda
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {players.map((player) => (
              <div key={player.id} className="tibia-panel p-4 border-tibia-stone">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-tibia-gold font-bold text-lg">
                        {player.character_name}
                      </div>
                      {player.paid_today && (
                        <span className="text-xs bg-tibia-green bg-opacity-20 text-tibia-green px-2 py-1 rounded">
                          ✓ Pagou Hoje
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-tibia-light-stone text-xs">Pagamentos</div>
                        <div className="text-tibia-gold font-semibold">
                          {player.total_payments}x
                        </div>
                      </div>
                      <div>
                        <div className="text-tibia-light-stone text-xs">Total Pago</div>
                        <div className="text-tibia-green font-semibold">
                          {formatCurrency(player.total_paid)}
                        </div>
                      </div>
                      <div>
                        <div className="text-tibia-light-stone text-xs">Último Pagamento</div>
                        <div className="text-white font-semibold">
                          {formatDate(player.last_payment_date)}
                        </div>
                      </div>
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
