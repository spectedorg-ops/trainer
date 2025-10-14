'use client'

import { useState, useEffect } from 'react'
import { User } from '@/lib/auth'
import { PlayerActivity, supabase } from '@/lib/supabase'
import PaymentHistory from './PaymentHistory'

interface PlayerCardImprovedProps {
  player: PlayerActivity
  currentUser: User | null
  onUpdate: () => void
}

export default function PlayerCardImproved({ player, currentUser, onUpdate }: PlayerCardImprovedProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentTime, setPaymentTime] = useState<string | null>(null)

  const isAdmin = currentUser?.is_admin || false

  // Buscar horário do pagamento de hoje
  useEffect(() => {
    async function loadPaymentTime() {
      if (!player.paid_today) {
        setPaymentTime(null)
        return
      }

      try {
        const today = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
          .from('payments')
          .select('created_at')
          .eq('player_id', player.id)
          .eq('payment_date', today)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!error && data) {
          setPaymentTime(data.created_at)
        }
      } catch (err) {
        console.error('Erro ao buscar horário de pagamento:', err)
      }
    }

    loadPaymentTime()
  }, [player.id, player.paid_today])

  const formatDateTime = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function handleToggleStatus() {
    if (!isAdmin) return

    setLoading(true)
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('character_name', player.character_name)
        .single()

      if (playerError || !playerData) {
        alert('Erro ao buscar player: ' + (playerError?.message || 'Player não encontrado'))
        return
      }

      if (player.paid_today) {
        const today = new Date().toISOString().split('T')[0]
        const { data: result, error } = await supabase
          .rpc('delete_today_payment_admin_only', {
            p_player_id: playerData.id,
            p_requesting_user_id: currentUser?.id,
            p_today_date: today
          })

        if (error) {
          alert('Erro ao remover pagamento: ' + error.message)
          return
        }

        if (result === 0) {
          alert('Nenhum pagamento encontrado para remover hoje')
          return
        }
      } else {
        const { error } = await supabase
          .from('payments')
          .insert([{
            player_id: playerData.id,
            payment_date: new Date().toISOString().split('T')[0],
            screenshot_url: null,
            proof_text: `[Admin] Status alterado por ${currentUser?.character_name}`,
            paid_by_user_id: currentUser?.id || null
          }])

        if (error) {
          alert('Erro ao adicionar status: ' + error.message)
          return
        }
      }

      setShowAdminMenu(false)
      onUpdate()
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!isAdmin) return
    if (!confirm(`Remover pagamento de ${player.character_name}?`)) return

    setLoading(true)
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('character_name', player.character_name)
        .single()

      if (playerError || !playerData) {
        alert('Erro ao buscar player: ' + (playerError?.message || 'Player não encontrado'))
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const { data: result, error } = await supabase
        .rpc('delete_today_payment_admin_only', {
          p_player_id: playerData.id,
          p_requesting_user_id: currentUser?.id,
          p_today_date: today
        })

      if (error) {
        alert('Erro ao remover pagamento: ' + error.message)
        return
      }

      if (result === 0) {
        alert('Nenhum pagamento encontrado para remover hoje')
        return
      }

      setShowAdminMenu(false)
      onUpdate()
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleHide() {
    if (!isAdmin) return
    if (!confirm(`Ocultar ${player.character_name} da lista?`)) return

    setLoading(true)
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('character_name', player.character_name)
        .single()

      if (playerError || !playerData) {
        alert('Erro ao buscar player: ' + (playerError?.message || 'Player não encontrado'))
        return
      }

      const { data: result, error } = await supabase
        .rpc('toggle_player_visibility', {
          p_player_id: playerData.id,
          p_requesting_user_id: currentUser?.id,
          p_hidden: true
        })

      if (error) {
        alert('Erro ao ocultar player: ' + error.message)
        return
      }

      setShowAdminMenu(false)
      onUpdate()
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calcular prazo de 10 minutos
  const getCaguetadoInfo = () => {
    if (!player.caguetado_at || player.paid_today) return null

    const caguetadoTime = new Date(player.caguetado_at)
    const deadlineTime = new Date(caguetadoTime.getTime() + 10 * 60 * 1000)
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

  return (
    <>
      <div
        className={`tibia-panel overflow-hidden hover-lift relative border-2 ${
          player.paid_today ? 'border-tibia-green' : 'border-tibia-red'
        }`}
      >
        {/* Status Indicator */}
        <div className={`card-indicator ${player.paid_today ? 'card-indicator-success' : 'card-indicator-danger'}`} />

        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
          </div>
        )}

        {/* Header Section */}
        <div
          className={`${
            player.paid_today
              ? 'bg-gradient-to-br from-emerald-900/30 to-green-900/20'
              : caguetadoInfo?.isPastDeadline
                ? 'bg-gradient-to-br from-red-900/30 to-rose-900/20'
                : 'bg-gradient-to-br from-amber-900/30 to-orange-900/20'
          }`}
          style={{padding: '1.75rem', textAlign: 'center'}}
        >
          {/* Nome do Player Centralizado */}
          <h3 className="text-2xl font-bold text-tibia-gold mb-6 flex items-center justify-center gap-2" style={{
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {player.character_name}
            {player.paid_today && <span className="text-lg">✓</span>}
          </h3>

          {/* Histórico de Pagamentos */}
          <div className="mb-6 flex justify-center" style={{
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs text-tibia-light-stone hover:text-tibia-gold transition-colors cursor-pointer flex items-center gap-1"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)'
              }}
              title="Ver histórico de pagamentos"
            >
              <span>📊</span>
              <span>{player.total_payments} pagamento{player.total_payments !== 1 ? 's' : ''}</span>
            </button>
          </div>

          {/* Status Badge Centralizado */}
          <div className="flex justify-center" style={{paddingTop: '0.5rem'}}>
              {player.paid_today ? (
                <div style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.5)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>✓</span>
                    <span style={{fontSize: '0.875rem'}}>PAGO</span>
                  </div>
                  {paymentTime && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 600
                    }}>
                      🕐 {formatDateTime(paymentTime)}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: caguetadoInfo?.isPastDeadline
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)',
                  border: caguetadoInfo?.isPastDeadline
                    ? '2px solid rgba(239, 68, 68, 0.5)'
                    : '2px solid rgba(245, 158, 11, 0.5)',
                  backdropFilter: 'blur(10px)',
                  animation: caguetadoInfo?.isPastDeadline ? 'pulse-glow 2s ease-in-out infinite' : 'none'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: caguetadoInfo?.isPastDeadline ? '#ef4444' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>{caguetadoInfo?.isPastDeadline ? '💰' : '👁️'}</span>
                    <span style={{fontSize: '0.875rem'}}>
                      {caguetadoInfo?.isPastDeadline ? 'MULTA' : 'CAGUETADO'}
                    </span>
                  </div>
                  {caguetadoInfo && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 600
                    }}>
                      🕐 {caguetadoInfo.caguetadoTimeStr}
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Progress Bar */}
          {!player.paid_today && caguetadoInfo && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-tibia-light-stone mb-2">
                <span>Prazo</span>
                <span>{caguetadoInfo.isPastDeadline ? 'EXPIRADO' : caguetadoInfo.deadlineTimeStr}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: caguetadoInfo.isPastDeadline ? '100%' : '60%',
                    background: caguetadoInfo.isPastDeadline
                      ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div style={{padding: '1.75rem', paddingTop: '1.25rem'}}>
          {/* Informação de Multa Destaque - Centralizada */}
          {caguetadoInfo && (
            <div
              className={`mb-5 rounded-xl border-2 ${
                caguetadoInfo.isPastDeadline
                  ? 'bg-red-500/10 border-red-500/50'
                  : 'bg-amber-500/10 border-amber-500/50'
              }`}
              style={{padding: '1.25rem', textAlign: 'center'}}
            >
              <div className="text-3xl mb-2">
                {caguetadoInfo.isPastDeadline ? '💰' : '⏰'}
              </div>
              <div className={`font-bold text-sm mb-2 ${
                caguetadoInfo.isPastDeadline ? 'text-red-400' : 'text-amber-400'
              }`}>
                {caguetadoInfo.isPastDeadline ? 'MULTA ATIVA - 2k GP EXTRA' : 'PRAZO ATIVO - 10 MINUTOS'}
              </div>
              <div className="text-xs text-tibia-light-stone space-y-1">
                <div>👁️ Caguetado: <span className="text-white font-semibold">{caguetadoInfo.caguetadoTimeStr}</span></div>
                {caguetadoInfo.isPastDeadline && (
                  <div className="mt-2 pt-2 border-t border-red-500/30 text-red-400">
                    Pagamento: 10k treino + 2k multa = <span className="font-bold">12k GP</span>
                    <div className="text-xs mt-1 opacity-80">
                      (2k vão para quem caguetou)
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="divider" />

          {/* Admin Controls */}
          {isAdmin && (
            <div className="space-y-3">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="w-full tibia-button bg-tibia-stone hover:bg-tibia-light-stone text-sm py-3 flex items-center justify-center gap-2"
                style={{fontSize: '0.875rem', fontWeight: 600}}
              >
                <span style={{fontSize: '1.5rem'}}>⚙️</span>
                <span>Admin</span>
                <span className="ml-auto">{showAdminMenu ? '▲' : '▼'}</span>
              </button>

              {showAdminMenu && (
                <div className="mt-3 space-y-2 p-4 rounded-xl slide-in-bottom" style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <button
                    onClick={handleToggleStatus}
                    disabled={loading}
                    className="w-full tibia-button py-3 flex items-center justify-center gap-2"
                    style={{fontSize: '0.875rem', fontWeight: 600}}
                  >
                    <span style={{fontSize: '1.5rem'}}>{player.paid_today ? '❌' : '✅'}</span>
                    <span>{player.paid_today ? 'Marcar Pendente' : 'Marcar Pago'}</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full tibia-button py-3 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    <span style={{fontSize: '1.5rem'}}>🗑️</span>
                    <span>Remover Pagamento</span>
                  </button>
                  <button
                    onClick={handleHide}
                    disabled={loading}
                    className="w-full tibia-button py-3 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    <span style={{fontSize: '1.5rem'}}>👁️‍🗨️</span>
                    <span>Ocultar Player</span>
                  </button>
                </div>
              )}
            </div>
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
    </>
  )
}
