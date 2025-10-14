'use client'

import { useState, useEffect } from 'react'
import { supabase, UserEarnings, CaguetaDetail } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface EarningsCardProps {
  currentUser: User
}

export default function EarningsCard({ currentUser }: EarningsCardProps) {
  const [earnings, setEarnings] = useState<UserEarnings | null>(null)
  const [details, setDetails] = useState<CaguetaDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadEarnings()
  }, [currentUser])

  async function loadEarnings() {
    try {
      setLoading(true)

      // Buscar earnings do usuário
      const { data: earningsData, error: earningsError } = await supabase
        .from('user_earnings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (earningsError) {
        console.error('Erro ao buscar earnings:', earningsError)
      } else {
        setEarnings(earningsData)
      }

      // Buscar detalhes dos caguetas
      const { data: detailsData, error: detailsError } = await supabase
        .from('cagueta_details')
        .select('*')
        .eq('caguetado_by_user_id', currentUser.id)
        .order('caguetado_at', { ascending: false })

      if (detailsError) {
        console.error('Erro ao buscar detalhes:', detailsError)
      } else {
        setDetails(detailsData || [])
      }
    } catch (error) {
      console.error('Erro ao carregar earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="tibia-panel p-6">
        <div className="text-center text-tibia-light-stone">
          Carregando earnings...
        </div>
      </div>
    )
  }

  if (!earnings || earnings.total_caguetados === 0) {
    return (
      <div className="tibia-panel p-6 text-center">
        <div className="text-4xl mb-3">👁️</div>
        <div className="text-tibia-light-stone text-sm">
          Você ainda não caguetou nenhum player
        </div>
        <div className="text-tibia-light-stone text-xs mt-2">
          💡 Use o botão "Caguetar" para adicionar players e ganhar 2k por cada um que não pagar no prazo!
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="tibia-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-tibia-gold">
            💰 Seus Earnings
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="tibia-button text-xs py-1 px-3"
          >
            {showDetails ? 'Ocultar' : 'Ver Detalhes'}
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-tibia-stone bg-opacity-30 rounded">
            <span className="text-tibia-light-stone text-sm">Total Caguetados:</span>
            <span className="text-tibia-gold font-bold text-lg">
              {earnings.total_caguetados}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-tibia-red bg-opacity-20 rounded border border-tibia-red">
            <span className="text-tibia-light-stone text-sm">Players com Multa:</span>
            <span className="text-tibia-red font-bold text-lg">
              {earnings.players_with_multa}
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-tibia-green bg-opacity-20 rounded border border-tibia-green">
            <div>
              <div className="text-tibia-light-stone text-sm">Total a Receber:</div>
              <div className="text-tibia-light-stone text-xs mt-1">
                ({earnings.players_with_multa} × 2,000 GP)
              </div>
            </div>
            <span className="text-tibia-green font-bold text-2xl">
              {(earnings.total_earnings_gp / 1000).toFixed(0)}k
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-tibia-stone">
          <div className="text-tibia-light-stone text-xs text-center">
            ℹ️ Você recebe 2k GP por cada player que não pagar dentro de 10 minutos
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="tibia-panel p-8 max-w-2xl w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-tibia-gold">
                📊 Detalhes dos Caguetas
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="tibia-button text-sm py-2 px-4"
              >
                Fechar
              </button>
            </div>

            {details.length === 0 ? (
              <div className="text-center text-tibia-light-stone py-8">
                Nenhum cagueta registrado
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {details.map(detail => (
                  <div
                    key={detail.player_id}
                    className={`p-4 rounded border ${
                      detail.earnings_gp > 0
                        ? 'bg-tibia-green bg-opacity-10 border-tibia-green'
                        : detail.deadline_passed && !detail.has_paid
                        ? 'bg-tibia-red bg-opacity-10 border-tibia-red'
                        : 'bg-tibia-stone bg-opacity-20 border-tibia-stone'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-tibia-gold">
                        {detail.character_name}
                      </div>
                      {detail.earnings_gp > 0 && (
                        <div className="text-tibia-green font-bold">
                          +{(detail.earnings_gp / 1000).toFixed(0)}k GP
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-tibia-light-stone space-y-1">
                      <div>
                        👁️ Caguetado: {formatDateTime(detail.caguetado_at)}
                      </div>

                      {detail.has_paid ? (
                        <>
                          <div className="text-tibia-green">
                            ✓ Pagou em: {detail.payment_time ? formatDateTime(detail.payment_time) : 'N/A'}
                          </div>
                          {detail.paid_with_multa && (
                            <div className="text-tibia-red font-bold mt-2">
                              ⚠️ PAGOU COM ATRASO (Multa aplicada)
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={detail.deadline_passed ? 'text-tibia-red font-bold' : 'text-tibia-gold'}>
                          {detail.deadline_passed ? '⚠️ NÃO PAGOU - Prazo expirado' : '⏰ Aguardando pagamento'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
