'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface PagamentoCagueta {
  caguetador_id: string
  caguetador_name: string
  total_a_receber: number
  total_pago: number
  saldo_devedor: number
  total_multas: number
}

interface AdminPagamentosCaguetasProps {
  currentUser: User
  onClose: () => void
}

export default function AdminPagamentosCaguetas({ currentUser, onClose }: AdminPagamentosCaguetasProps) {
  const [pagamentos, setPagamentos] = useState<PagamentoCagueta[]>([])
  const [loading, setLoading] = useState(true)
  const [pagandoId, setPagandoId] = useState<string | null>(null)
  const [valorPagar, setValorPagar] = useState('')

  useEffect(() => {
    loadPagamentos()
  }, [])

  async function loadPagamentos() {
    try {
      setLoading(true)

      const { data, error } = await supabase.rpc('get_admin_pagamentos_caguetas')

      if (error) {
        console.error('Erro ao buscar pagamentos:', error)
        alert('Erro ao carregar dados: ' + error.message)
      } else {
        setPagamentos(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegistrarPagamento(caguetadorId: string) {
    if (!valorPagar || parseFloat(valorPagar) <= 0) {
      alert('Digite um valor válido maior que zero')
      return
    }

    const valor = parseFloat(valorPagar) * 1000 // Converter para GP (k)

    try {
      const { error } = await supabase
        .from('admin_pagamentos_caguetas')
        .insert([{
          caguetador_id: caguetadorId,
          valor_pago: valor,
          pago_por_admin_id: currentUser.id
        }])

      if (error) {
        alert('Erro ao registrar pagamento: ' + error.message)
        return
      }

      alert('✓ Pagamento registrado com sucesso!')
      setValorPagar('')
      setPagandoId(null)
      loadPagamentos()
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.4)'
        }}
      >
        <div className="tibia-panel p-8 max-w-4xl w-full">
          <div className="text-center text-tibia-light-stone">
            Carregando dados...
          </div>
        </div>
      </div>
    )
  }

  const totalGeral = pagamentos.reduce((sum, p) => sum + p.saldo_devedor, 0)

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
      <div className="tibia-panel p-8 max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-tibia-gold">
            💰 Controle de Pagamentos - Caguetas
          </h2>
          <button
            onClick={onClose}
            className="tibia-button text-sm py-2 px-4"
          >
            Fechar
          </button>
        </div>

        {/* Resumo Geral */}
        <div className="mb-6 p-4 bg-tibia-red bg-opacity-20 border border-tibia-red rounded">
          <div className="text-center">
            <div className="text-tibia-light-stone text-sm mb-1">
              Total a pagar aos caguetas:
            </div>
            <div className="text-tibia-gold font-bold text-3xl">
              {(totalGeral / 1000).toFixed(1)}k GP
            </div>
          </div>
        </div>

        {pagamentos.length === 0 ? (
          <div className="text-center py-8 text-tibia-light-stone">
            Nenhum pagamento pendente! 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {pagamentos.map((pagamento) => (
              <div
                key={pagamento.caguetador_id}
                className="tibia-panel border-tibia-stone p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-tibia-gold font-bold text-lg mb-1">
                      {pagamento.caguetador_name}
                    </div>
                    <div className="text-tibia-light-stone text-xs">
                      {pagamento.total_multas} multa{pagamento.total_multas !== 1 ? 's' : ''} aplicada{pagamento.total_multas !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-2xl font-bold ${pagamento.saldo_devedor > 0 ? 'text-tibia-red' : 'text-tibia-green'}`}>
                      {(pagamento.saldo_devedor / 1000).toFixed(1)}k GP
                    </div>
                    <div className="text-tibia-light-stone text-xs">
                      {pagamento.saldo_devedor > 0 ? 'a pagar' : 'quitado'}
                    </div>
                  </div>
                </div>

                {/* Detalhes */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div className="p-2 bg-tibia-stone bg-opacity-20 rounded">
                    <div className="text-tibia-light-stone text-xs">Total a receber:</div>
                    <div className="text-tibia-gold font-bold">
                      {(pagamento.total_a_receber / 1000).toFixed(1)}k GP
                    </div>
                  </div>
                  <div className="p-2 bg-tibia-green bg-opacity-10 rounded border border-tibia-green">
                    <div className="text-tibia-light-stone text-xs">Já pago:</div>
                    <div className="text-tibia-green font-bold">
                      {(pagamento.total_pago / 1000).toFixed(1)}k GP
                    </div>
                  </div>
                </div>

                {/* Form de Pagamento */}
                {pagamento.saldo_devedor > 0 && (
                  <div className="mt-4 pt-4 border-t border-tibia-stone">
                    {pagandoId === pagamento.caguetador_id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={valorPagar}
                          onChange={(e) => setValorPagar(e.target.value)}
                          className="tibia-input flex-1"
                          placeholder="Valor em k (ex: 2.5)"
                          step="0.1"
                          min="0.1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRegistrarPagamento(pagamento.caguetador_id)}
                          className="tibia-button text-sm px-4"
                        >
                          ✓ Confirmar
                        </button>
                        <button
                          onClick={() => {
                            setPagandoId(null)
                            setValorPagar('')
                          }}
                          className="tibia-button bg-tibia-stone text-sm px-4"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPagandoId(pagamento.caguetador_id)}
                        className="w-full tibia-button text-sm py-2"
                      >
                        💵 Registrar Pagamento
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-tibia-stone text-center">
          <div className="text-tibia-light-stone text-xs">
            ℹ️ Cada multa aplicada = 2k GP para quem caguetou (pagamento mantém anonimato)
          </div>
        </div>
      </div>
    </div>
  )
}
