'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface MyPaymentsProps {
  onClose: () => void
  currentUser: User
}

interface PaymentRecord {
  id: string
  payment_date: string
  created_at: string
  proof_text: string
  players: {
    character_name: string
  }
}

export default function MyPayments({ onClose, currentUser }: MyPaymentsProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMyPayments()
  }, [])

  async function loadMyPayments() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          payment_date,
          created_at,
          proof_text,
          players!inner(character_name)
        `)
        .eq('paid_by_user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformar dados para o formato correto
      const transformedData = (data || []).map((payment: any) => ({
        id: payment.id,
        payment_date: payment.payment_date,
        created_at: payment.created_at,
        proof_text: payment.proof_text,
        players: {
          character_name: Array.isArray(payment.players)
            ? payment.players[0]?.character_name || ''
            : payment.players?.character_name || ''
        }
      }))

      setPayments(transformedData)
    } catch (error) {
      console.error('Erro ao carregar meus pagamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const extractAmount = (text: string) => {
    const match = text.match(/deposited\s+([\d,]+)\s+gold/i)
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''))
      return amount >= 12000 ? '12k' : '10k'
    }
    return '10k'
  }

  // Agrupar por data
  const paymentsByDate = payments.reduce((acc, payment) => {
    const date = payment.payment_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(payment)
    return acc
  }, {} as Record<string, PaymentRecord[]>)

  const totalDays = Object.keys(paymentsByDate).length
  const totalPayments = payments.length
  const totalAmount = payments.reduce((sum, p) => {
    const amount = extractAmount(p.proof_text || '')
    return sum + (amount === '12k' ? 12000 : 10000)
  }, 0)

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
      }}
      onClick={onClose}
    >
      <div
        className="tibia-panel p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão X para fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-tibia-gold hover:text-tibia-light-gold transition-colors z-10"
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
          💳 Meus Pagamentos 💳
        </h2>
        <p className="text-tibia-light-stone text-center mb-6 text-sm">
          Histórico de pagamentos feitos por você
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="tibia-panel p-4 text-center border-tibia-stone">
            <div className="text-3xl font-bold text-tibia-gold mb-1">
              {totalDays}
            </div>
            <div className="text-tibia-light-stone text-sm">
              Dias com Pagamento
            </div>
          </div>
          <div className="tibia-panel p-4 text-center border-tibia-stone">
            <div className="text-3xl font-bold text-tibia-green mb-1">
              {totalPayments}
            </div>
            <div className="text-tibia-light-stone text-sm">
              Total de Pagamentos
            </div>
          </div>
          <div className="tibia-panel p-4 text-center border-tibia-stone">
            <div className="text-3xl font-bold text-tibia-gold mb-1">
              {(totalAmount / 1000).toFixed(0)}k
            </div>
            <div className="text-tibia-light-stone text-sm">
              Valor Total Pago
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto mb-3" style={{margin: '0 auto 0.75rem'}}></div>
            <div className="text-tibia-light-stone">Carregando histórico...</div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-tibia-light-stone">
              Você ainda não fez nenhum pagamento
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {Object.entries(paymentsByDate).map(([date, datePayments]) => (
              <div key={date} className="tibia-panel p-4 border-tibia-stone">
                <div className="text-tibia-gold font-bold mb-3 flex items-center justify-between">
                  <span>📅 {formatDate(date)}</span>
                  <span className="text-sm text-tibia-light-stone">
                    {datePayments.length} pagamento{datePayments.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {datePayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-3 rounded bg-tibia-dark-brown border border-tibia-stone"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-tibia-light-stone text-sm">
                          🕐 {formatDateTime(payment.created_at)}
                        </div>
                        <div className="px-2 py-1 rounded bg-tibia-green bg-opacity-20 text-tibia-green text-xs font-bold">
                          💰 {extractAmount(payment.proof_text || '')} GP
                        </div>
                      </div>
                      <div className="text-tibia-gold text-sm font-semibold">
                        👤 Para: {payment.players.character_name}
                      </div>
                      {payment.proof_text && (
                        <div className="mt-2 p-2 bg-black bg-opacity-30 rounded text-tibia-light-stone text-xs font-mono">
                          {payment.proof_text}
                        </div>
                      )}
                    </div>
                  ))}
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
