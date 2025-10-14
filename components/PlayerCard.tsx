'use client'

import { useState } from 'react'
import { User } from '@/lib/auth'
import { PlayerActivity, supabase } from '@/lib/supabase'
import PaymentHistory from './PaymentHistory'

interface PlayerCardProps {
  player: PlayerActivity
  currentUser: User | null
  onUpdate: () => void
}

export default function PlayerCard({ player, currentUser, onUpdate }: PlayerCardProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showHideConfirm, setShowHideConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const isAdmin = currentUser?.is_admin || false

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calcular prazo de 10 minutos
  const getCaguetadoInfo = () => {
    if (!player.caguetado_at || player.paid_today) return null

    const caguetadoTime = new Date(player.caguetado_at)
    const deadlineTime = new Date(caguetadoTime.getTime() + 10 * 60 * 1000) // +10 minutos
    const now = new Date()
    const isPastDeadline = now > deadlineTime

    return {
      caguetadoTime,
      deadlineTime,
      isPastDeadline,
      caguetadoTimeStr: formatDateTime(player.caguetado_at),
      deadlineTimeStr: formatDateTime(deadlineTime.toISOString())
    }
  }

  const caguetadoInfo = getCaguetadoInfo()

  async function handleToggleStatus() {
    if (!isAdmin) {
      console.log('❌ Usuário não é admin')
      return
    }

    console.log('🔄 Iniciando toggle status...')
    console.log('Player:', player.character_name, 'ID:', player.id)
    console.log('Paid today:', player.paid_today)

    setLoading(true)
    try {
      // Buscar o player_id correspondente ao character_name
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('character_name', player.character_name)
        .single()

      console.log('Player data:', playerData)
      console.log('Player error:', playerError)

      if (playerError || !playerData) {
        alert('Erro ao buscar player: ' + (playerError?.message || 'Player não encontrado'))
        return
      }

      if (player.paid_today) {
        // Remover o pagamento de hoje usando função segura (verifica admin no backend)
        const today = new Date().toISOString().split('T')[0]
        console.log('🗑️ Removendo pagamento de hoje:', today)
        console.log('Player ID:', playerData.id)
        console.log('Current User ID:', currentUser?.id)

        // Chamar função PostgreSQL que verifica se é admin
        const { data: result, error } = await supabase
          .rpc('delete_today_payment_admin_only', {
            p_player_id: playerData.id,
            p_requesting_user_id: currentUser?.id,
            p_today_date: today
          })

        console.log('Delete result:', result, 'Error:', error)

        if (error) {
          console.error('❌ Erro ao deletar:', error)
          alert('Erro ao remover pagamento: ' + error.message)
          return
        }

        if (result === 0) {
          console.warn('⚠️ Nenhum pagamento encontrado para hoje')
          alert('Nenhum pagamento encontrado para remover hoje')
          return
        }

        console.log(`✅ ${result} pagamento(s) removido(s) com sucesso!`)
      } else {
        // Adicionar pagamento de hoje
        console.log('➕ Adicionando pagamento...')

        const { error } = await supabase
          .from('payments')
          .insert([{
            player_id: playerData.id,
            payment_date: new Date().toISOString().split('T')[0],
            screenshot_url: null,
            proof_text: `[Admin] Status alterado por ${currentUser?.character_name}`,
            paid_by_user_id: currentUser?.id || null
          }])

        console.log('Insert error:', error)

        if (error) {
          alert('Erro ao adicionar status: ' + error.message)
          return
        }

        console.log('✅ Pagamento adicionado com sucesso!')
      }

      console.log('🔄 Chamando onUpdate()...')
      onUpdate()
    } catch (err: any) {
      console.error('❌ Erro inesperado:', err)
      alert('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!isAdmin) {
      console.log('❌ Usuário não é admin')
      return
    }

    console.log('🗑️ Iniciando remoção de pagamento...')
    console.log('Player:', player.character_name, 'ID:', player.id)

    setLoading(true)
    try {
      // Buscar o player_id correspondente ao character_name
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('character_name', player.character_name)
        .single()

      console.log('Player data:', playerData)
      console.log('Player error:', playerError)

      if (playerError || !playerData) {
        alert('Erro ao buscar player: ' + (playerError?.message || 'Player não encontrado'))
        return
      }

      // Remover apenas o pagamento de hoje usando função segura
      const today = new Date().toISOString().split('T')[0]
      console.log('🗑️ Removendo pagamento de hoje:', today)
      console.log('Player ID:', playerData.id)
      console.log('Current User ID:', currentUser?.id)

      // Chamar função PostgreSQL que verifica se é admin
      const { data: result, error } = await supabase
        .rpc('delete_today_payment_admin_only', {
          p_player_id: playerData.id,
          p_requesting_user_id: currentUser?.id,
          p_today_date: today
        })

      console.log('Delete result:', result, 'Error:', error)

      if (error) {
        console.error('❌ Erro ao deletar:', error)
        alert('Erro ao remover pagamento: ' + error.message)
        return
      }

      if (result === 0) {
        console.warn('⚠️ Nenhum pagamento encontrado para hoje')
        alert('Nenhum pagamento encontrado para remover hoje')
        return
      }

      console.log(`✅ ${result} pagamento(s) removido(s) com sucesso!`)
      setShowDeleteConfirm(false)
      onUpdate()
    } catch (err: any) {
      console.error('❌ Erro inesperado:', err)
      alert('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleHide() {
    if (!isAdmin) {
      console.log('❌ Usuário não é admin')
      return
    }

    console.log('👁️‍🗨️ Iniciando ocultação de player...')
    console.log('Player:', player.character_name, 'ID:', player.id)

    setLoading(true)
    try {
      // Buscar o player_id correspondente ao character_name
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('character_name', player.character_name)
        .single()

      if (playerError || !playerData) {
        alert('Erro ao buscar player: ' + (playerError?.message || 'Player não encontrado'))
        return
      }

      // Chamar função PostgreSQL que verifica se é admin e oculta o player
      const { data: result, error } = await supabase
        .rpc('toggle_player_visibility', {
          p_player_id: playerData.id,
          p_requesting_user_id: currentUser?.id,
          p_hidden: true
        })

      console.log('Hide result:', result, 'Error:', error)

      if (error) {
        console.error('❌ Erro ao ocultar:', error)
        alert('Erro ao ocultar player: ' + error.message)
        return
      }

      console.log('✅ Player ocultado com sucesso!')
      setShowHideConfirm(false)
      onUpdate()
    } catch (err: any) {
      console.error('❌ Erro inesperado:', err)
      alert('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`tibia-panel p-6 ${player.paid_today ? 'border-tibia-green' : 'border-tibia-red'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-tibia-gold mb-1">
              {player.character_name}
            </h3>
            <div className="text-xs text-tibia-light-stone">
              {player.total_payments} pagamento{player.total_payments !== 1 ? 's' : ''}
            </div>
          </div>
          <div>
            {player.paid_today ? (
              <span className="status-paid">✓ PAGO</span>
            ) : (
              <span className="status-pending">👁️ CAGUETADO</span>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-tibia-light-stone">Último pagamento:</span>
            <span className="text-tibia-gold">{formatDate(player.last_payment_date)}</span>
          </div>

          {/* Informação de Caguetado */}
          {caguetadoInfo && (
            <div className={`p-3 rounded mt-2 ${caguetadoInfo.isPastDeadline ? 'bg-tibia-red bg-opacity-20 border border-tibia-red' : 'bg-tibia-gold bg-opacity-10 border border-tibia-gold'}`}>
              <div className={`text-xs font-bold mb-2 ${caguetadoInfo.isPastDeadline ? 'text-tibia-red' : 'text-tibia-gold'}`}>
                {caguetadoInfo.isPastDeadline ? '⚠️ MULTA ATIVA' : '⏰ PRAZO ATIVO'}
              </div>
              <div className="text-tibia-light-stone text-xs space-y-1">
                <div>
                  👁️ Caguetado às: <span className="text-tibia-gold font-semibold">{caguetadoInfo.caguetadoTimeStr}</span>
                </div>
                <div>
                  ⏱️ Prazo até: <span className={`font-semibold ${caguetadoInfo.isPastDeadline ? 'text-tibia-red line-through' : 'text-tibia-green'}`}>
                    {caguetadoInfo.deadlineTimeStr}
                  </span>
                </div>
                {caguetadoInfo.isPastDeadline ? (
                  <div className="mt-2 pt-2 border-t border-tibia-red">
                    <div className="text-tibia-red font-bold text-xs">
                      💰 Multa: 2k GP extra
                    </div>
                    <div className="text-tibia-light-stone text-xs">
                      (2k vão para quem caguetou)
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-tibia-gold">
                    <div className="text-tibia-green text-xs">
                      ✓ Sem multa se pagar até {caguetadoInfo.deadlineTimeStr}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-tibia-stone">
          <button
            onClick={() => setShowHistory(true)}
            className="w-full tibia-button text-sm py-2"
          >
            📜 Ver Histórico
          </button>

          {/* Admin Buttons */}
          {isAdmin && (
            <>
              <div style={{marginTop: '0.5rem', display: 'flex', gap: '0.5rem'}}>
                <button
                  onClick={handleToggleStatus}
                  disabled={loading}
                  className="flex-1 tibia-button text-xs py-2"
                  style={{fontSize: '0.75rem'}}
                >
                  {loading ? '...' : player.paid_today ? '❌ Marcar Pendente' : '✅ Marcar Pago'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="flex-1 tibia-button bg-tibia-stone hover:bg-tibia-light-stone text-xs py-2"
                  style={{fontSize: '0.75rem'}}
                >
                  🗑️ Remover Pgto
                </button>
              </div>
              <div style={{marginTop: '0.5rem'}}>
                <button
                  onClick={() => setShowHideConfirm(true)}
                  disabled={loading}
                  className="w-full tibia-button text-xs py-2"
                  style={{
                    fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                  }}
                >
                  👁️‍🗨️ Ocultar (Troll/Fake)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showHistory && (
        <PaymentHistory
          playerId={player.id}
          playerName={player.character_name}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="tibia-panel p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-tibia-red mb-4 text-center">
              ⚠️ Remover Pagamento ⚠️
            </h2>
            <p className="text-tibia-light-stone text-center mb-6">
              Tem certeza que deseja remover o pagamento de hoje de <span className="text-tibia-gold font-bold">{player.character_name}</span>?
              <br />
              <span className="text-tibia-light-stone text-sm mt-2 block">
                ℹ️ O player continuará cadastrado, apenas o pagamento do dia será removido
              </span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 tibia-button bg-tibia-stone hover:bg-tibia-light-stone"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 tibia-button"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                }}
              >
                {loading ? 'Removendo...' : '🗑️ Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hide Confirmation Modal */}
      {showHideConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="tibia-panel p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-tibia-gold mb-4 text-center">
              👁️‍🗨️ Ocultar Player 👁️‍🗨️
            </h2>
            <p className="text-tibia-light-stone text-center mb-6">
              Tem certeza que deseja ocultar <span className="text-tibia-gold font-bold">{player.character_name}</span>?
              <br />
              <span className="text-tibia-light-stone text-sm mt-2 block">
                ⚠️ Este player será ocultado para TODOS os usuários na tela inicial
              </span>
              <span className="text-tibia-light-stone text-xs mt-2 block">
                ℹ️ Use isso para ocultar trolls/fakes. O player continuará no banco de dados e poderá ser reativado depois.
              </span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowHideConfirm(false)}
                disabled={loading}
                className="flex-1 tibia-button bg-tibia-stone hover:bg-tibia-light-stone"
              >
                Cancelar
              </button>
              <button
                onClick={handleHide}
                disabled={loading}
                className="flex-1 tibia-button"
                style={{
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                }}
              >
                {loading ? 'Ocultando...' : '👁️‍🗨️ Ocultar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
