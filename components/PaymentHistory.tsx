'use client'

import { useEffect, useState } from 'react'
import { supabase, Payment } from '@/lib/supabase'
import Image from 'next/image'

interface PaymentHistoryProps {
  playerId: string
  playerName: string
  onClose: () => void
}

export default function PaymentHistory({ playerId, playerName, onClose }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)

  useEffect(() => {
    loadPayments()
  }, [playerId])

  async function loadPayments() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          paid_by:users!paid_by_user_id(character_name),
          players!inner(caguetado_at)
        `)
        .eq('player_id', playerId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
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

  const extractTime = (text: string) => {
    // Extrair horário do formato: "11:18 Player White Widow deposited 10,000 gold coins."
    const timeMatch = text.match(/^(\d{1,2}:\d{2})/)
    return timeMatch ? timeMatch[1] : null
  }

  const calculatePaymentAmount = (payment: any): number => {
    // Se não tem proof_text, assumir 10k
    if (!payment.proof_text) return 10000

    // Tentar extrair o valor do proof_text
    const amountMatch = payment.proof_text.match(/deposited\s+([\d,]+)\s+gold/i)
    if (amountMatch) {
      const amount = parseInt(amountMatch[1].replace(/,/g, ''))
      return amount
    }

    // Se tem informação de caguetado, calcular baseado no prazo
    if (payment.players?.caguetado_at) {
      const caguetadoTime = new Date(payment.players.caguetado_at)
      const paymentTime = new Date(payment.created_at)
      const deadlineTime = new Date(caguetadoTime.getTime() + 10 * 60 * 1000) // +10 minutos

      // Se pagou depois do prazo, é 12k (multa)
      if (paymentTime > deadlineTime) {
        return 12000
      }
    }

    // Default: 10k
    return 10000
  }

  const formatCurrency = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`
    }
    return value.toString()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto"
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
            📜 Histórico de Pagamentos 📜
          </h2>
          <p className="text-tibia-light-stone text-center mb-6">
            {playerName}
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-tibia-gold">⏳ Carregando histórico...</div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-tibia-light-stone">
                Nenhum pagamento registrado ainda
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {payments.map((payment) => {
                const time = payment.proof_text ? extractTime(payment.proof_text) : null
                const amount = calculatePaymentAmount(payment)
                const isMulta = amount > 10000
                return (
                  <div key={payment.id} className="tibia-panel p-4 border-tibia-stone">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-tibia-gold font-bold">
                            {formatDate(payment.payment_date)}
                          </div>
                          <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                            isMulta
                              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                              : 'bg-green-500/20 text-green-400 border border-green-500/50'
                          }`}>
                            💰 {formatCurrency(amount)} GP {isMulta && '(+2k multa)'}
                          </div>
                        </div>
                        {time && (
                          <div className="text-tibia-green text-sm mb-1">
                            ⏰ Horário: {time}
                          </div>
                        )}
                        <div className="text-tibia-light-stone text-xs mb-2">
                          Registrado em: {new Date(payment.created_at).toLocaleString('pt-BR')}
                        </div>
                        {payment.paid_by && (
                          <div className="text-tibia-green text-sm mb-2">
                            💳 Pago Por: <span className="font-semibold">{payment.paid_by.character_name}</span>
                          </div>
                        )}
                        {payment.proof_text && (
                          <div className="mt-2 p-2 bg-tibia-dark-brown rounded border border-tibia-stone">
                            <div className="text-tibia-light-stone text-xs font-mono">
                              {payment.proof_text}
                            </div>
                          </div>
                        )}
                      </div>
                      {payment.screenshot_url && (
                        <button
                          onClick={() => setSelectedScreenshot(payment.screenshot_url)}
                          className="tibia-button text-sm py-2 px-4 whitespace-nowrap"
                        >
                          🖼️ Ver Screenshot
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
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

      {/* Modal para visualizar screenshot */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60]"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="max-w-4xl w-full">
            <div className="tibia-panel p-4 mb-4">
              <h3 className="text-tibia-gold text-center font-bold">
                Comprovante de Pagamento
              </h3>
            </div>
            <div className="relative bg-black rounded">
              <img
                src={selectedScreenshot}
                alt="Comprovante de pagamento"
                className="w-full h-auto rounded"
              />
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="tibia-button"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
