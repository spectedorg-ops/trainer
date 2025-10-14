'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

import { PlayerActivity } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface AddPaymentProps {
  players: PlayerActivity[]
  currentUser: User
  onClose: () => void
  onSuccess: () => void
}

export default function AddPayment({ players, currentUser, onClose, onSuccess }: AddPaymentProps) {
  // Encontrar o player correspondente ao usuário logado
  const currentPlayer = players.find(p => p.character_name === currentUser.character_name)
  const [paymentType, setPaymentType] = useState<'self' | 'other' | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [proofText, setProofText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filtrar players baseado na busca
  const filteredPlayers = players.filter(player =>
    player.character_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Verificar se o player selecionado está caguetado (não pagou ainda)
  const selectedPlayer = players.find(p => p.id === selectedPlayerId)
  const isCaguetado = selectedPlayer && !selectedPlayer.paid_today

  // Calcular se passou o prazo de 10 minutos
  const getDeadlineInfo = () => {
    if (!selectedPlayer?.caguetado_at || selectedPlayer.paid_today) return null

    const caguetadoTime = new Date(selectedPlayer.caguetado_at)
    const deadlineTime = new Date(caguetadoTime.getTime() + 10 * 60 * 1000) // +10 minutos
    const now = new Date()
    const isPastDeadline = now > deadlineTime

    return {
      isPastDeadline,
      caguetadoTimeStr: caguetadoTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      deadlineTimeStr: deadlineTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const deadlineInfo = getDeadlineInfo()
  const isPastDeadline = deadlineInfo?.isPastDeadline || false
  const paymentAmount = isCaguetado && isPastDeadline ? '12,000' : '10,000'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let playerIdToUse = selectedPlayerId

    // Se for um novo player (ID = 'new'), criar o player com o nome do searchTerm
    if (playerIdToUse === 'new') {
      if (!searchTerm.trim()) {
        setError('Por favor, digite o nome do jogador')
        return
      }

      const { data: newPlayer, error: createPlayerError } = await supabase
        .from('players')
        .insert([{ character_name: searchTerm.trim() }])
        .select()
        .single()

      if (createPlayerError) {
        if (createPlayerError.code === '23505') {
          // Player já existe, buscar o ID
          const { data: existingPlayer, error: fetchError } = await supabase
            .from('players')
            .select('id')
            .eq('character_name', searchTerm.trim())
            .single()

          if (fetchError || !existingPlayer) {
            setError('Erro ao buscar jogador. Tente novamente.')
            return
          }
          playerIdToUse = existingPlayer.id
        } else {
          setError('Erro ao criar registro do jogador: ' + createPlayerError.message)
          return
        }
      } else {
        playerIdToUse = newPlayer.id
      }
    }

    // Se não tem player selecionado, criar o player automaticamente para o usuário atual
    if (!playerIdToUse) {
      // Criar player automaticamente para o usuário atual
      const { data: newPlayer, error: createPlayerError } = await supabase
        .from('players')
        .insert([{ character_name: currentUser.character_name }])
        .select()
        .single()

      if (createPlayerError) {
        if (createPlayerError.code === '23505') {
          // Player já existe, buscar o ID
          const { data: existingPlayer, error: fetchError } = await supabase
            .from('players')
            .select('id')
            .eq('character_name', currentUser.character_name)
            .single()

          if (fetchError || !existingPlayer) {
            setError('Erro ao buscar jogador. Tente novamente.')
            return
          }
          playerIdToUse = existingPlayer.id
        } else {
          setError('Erro ao criar registro do jogador: ' + createPlayerError.message)
          return
        }
      } else {
        playerIdToUse = newPlayer.id
      }
    }

    if (!playerIdToUse) {
      setError('Por favor, selecione um jogador')
      return
    }

    if (!proofText.trim()) {
      setError('Por favor, insira o texto do comprovante')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Inserir pagamento (permitir múltiplos pagamentos por dia)
      const { error: insertError } = await supabase
        .from('payments')
        .insert([{
          player_id: playerIdToUse,
          screenshot_url: null,
          proof_text: proofText.trim(),
          payment_date: new Date().toISOString().split('T')[0],
          paid_by_user_id: currentUser.id
        }])

      if (insertError) {
        setError('Erro ao registrar pagamento: ' + insertError.message)
        setLoading(false)
        return
      }

      onSuccess()
    } catch (err) {
      setError('Erro inesperado ao processar pagamento')
      console.error(err)
      setLoading(false)
    }
  }

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
        className="tibia-panel p-8 max-w-md w-full my-8 relative"
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
          💰 Adicionar Pagamento 💰
        </h2>
        <p className="text-tibia-light-stone text-center text-sm mb-6">
          Deposite <span className="text-tibia-gold font-bold">10,000 GP</span> para <span className="text-tibia-gold font-bold">White Widow</span>
        </p>

        <form onSubmit={handleSubmit}>
          {/* Seleção de Tipo de Pagamento */}
          {!paymentType ? (
            <div className="space-y-4 mb-6">
              <div className="text-tibia-light-stone text-sm text-center mb-4">
                Selecione uma opção:
              </div>

              {/* Opção 1: Pagar para meu personagem */}
              <button
                type="button"
                onClick={() => {
                  setPaymentType('self')
                  setSelectedPlayerId(currentPlayer?.id || '')
                }}
                className="w-full p-6 rounded-xl border-2 border-tibia-gold bg-gradient-to-br from-emerald-900/20 to-green-900/10 hover:from-emerald-900/30 hover:to-green-900/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl">👤</div>
                  <div className="flex-1 text-left">
                    <div className="text-tibia-gold font-bold text-lg mb-1">
                      Pagar para meu personagem
                    </div>
                    <div className="text-tibia-light-stone text-sm">
                      {currentUser.character_name}
                    </div>
                  </div>
                  <div className="text-tibia-gold text-2xl">→</div>
                </div>
              </button>

              {/* Opção 2: Pagar para outra pessoa */}
              <button
                type="button"
                onClick={() => setPaymentType('other')}
                className="w-full p-6 rounded-xl border-2 border-tibia-light-stone bg-gradient-to-br from-amber-900/20 to-orange-900/10 hover:from-amber-900/30 hover:to-orange-900/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl">👥</div>
                  <div className="flex-1 text-left">
                    <div className="text-tibia-gold font-bold text-lg mb-1">
                      Pagar para outra pessoa
                    </div>
                    <div className="text-tibia-light-stone text-sm">
                      Selecionar outro jogador
                    </div>
                  </div>
                  <div className="text-tibia-gold text-2xl">→</div>
                </div>
              </button>
            </div>
          ) : (
            <>
              {/* Botão voltar */}
              <button
                type="button"
                onClick={() => {
                  setPaymentType(null)
                  setSelectedPlayerId('')
                  setSearchTerm('')
                }}
                className="mb-4 text-tibia-light-stone hover:text-tibia-gold text-sm flex items-center gap-2"
              >
                ← Voltar
              </button>

              {/* Campo de pesquisa (apenas se for "other") */}
              {paymentType === 'other' && (
                <div className="mb-6 p-4 rounded-xl border border-tibia-stone bg-tibia-dark-brown/50">
                  <label className="block text-tibia-light-stone mb-3 text-sm font-semibold">
                    🔍 Pesquisar Nome do Personagem
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      // Limpar seleção se o texto mudar
                      if (selectedPlayerId) {
                        setSelectedPlayerId('')
                      }
                    }}
                    className="w-full tibia-input mb-3"
                    placeholder="Digite o nome do personagem..."
                    disabled={loading}
                  />

                  {searchTerm && !selectedPlayerId && (
                    <div className="max-h-48 overflow-y-auto border-2 border-tibia-stone rounded-lg bg-tibia-dark-brown">
                      {filteredPlayers.length === 0 ? (
                        <div className="p-4">
                          <div className="text-center text-tibia-light-stone text-sm mb-3">
                            Nenhum jogador encontrado com este nome
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              // Marcar que é um novo player (ID vazio)
                              setSelectedPlayerId('new')
                            }}
                            className="w-full p-3 rounded-lg bg-tibia-green bg-opacity-20 hover:bg-opacity-30 border-2 border-tibia-green text-tibia-green font-bold transition-all"
                          >
                            ➕ Adicionar "{searchTerm}" como novo jogador
                          </button>
                        </div>
                      ) : (
                        <>
                          {filteredPlayers.map(player => (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => {
                                setSelectedPlayerId(player.id)
                              }}
                              className="w-full p-3 text-left hover:bg-tibia-stone transition-colors border-b border-tibia-stone text-tibia-light-stone"
                            >
                              {player.character_name}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlayerId('new')
                            }}
                            className="w-full p-3 text-left bg-tibia-green bg-opacity-10 hover:bg-opacity-20 text-tibia-green font-semibold border-t-2 border-tibia-green transition-all"
                          >
                            ➕ Adicionar "{searchTerm}" como novo jogador
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {selectedPlayerId && selectedPlayerId !== 'new' && (
                    <div className="p-3 rounded-lg bg-tibia-gold bg-opacity-10 border-2 border-tibia-gold text-tibia-gold text-sm flex items-center justify-between">
                      <span>✓ {players.find(p => p.id === selectedPlayerId)?.character_name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlayerId('')
                          setSearchTerm('')
                        }}
                        className="text-tibia-red hover:text-red-400 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {selectedPlayerId === 'new' && (
                    <div className="p-3 rounded-lg bg-tibia-green bg-opacity-10 border-2 border-tibia-green text-tibia-green text-sm flex items-center justify-between">
                      <span>➕ Novo jogador: {searchTerm}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlayerId('')
                          setSearchTerm('')
                        }}
                        className="text-tibia-red hover:text-red-400 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mostrar personagem selecionado (se for "self") */}
              {paymentType === 'self' && (
                <div className="mb-6 p-4 rounded-xl border-2 border-tibia-gold bg-tibia-gold bg-opacity-10">
                  <div className="text-tibia-gold font-bold text-center">
                    ✓ Pagamento para: {currentUser.character_name}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Aviso de Caguetado/Multa */}
          {paymentType && isCaguetado && deadlineInfo && (
            <div className={`mb-6 p-5 rounded-xl border-2 ${isPastDeadline ? 'bg-tibia-red bg-opacity-20 border-tibia-red' : 'bg-tibia-gold bg-opacity-10 border-tibia-gold'}`}>
              <div className={`font-bold text-sm mb-2 ${isPastDeadline ? 'text-tibia-red' : 'text-tibia-gold'}`}>
                {isPastDeadline ? '⚠️ MULTA ATIVA ⚠️' : '⏰ CAGUETADO - DENTRO DO PRAZO'}
              </div>
              <div className="text-tibia-light-stone text-xs space-y-1">
                <div>
                  👁️ Caguetado às: <span className="text-tibia-gold font-semibold">{deadlineInfo.caguetadoTimeStr}</span>
                </div>
                <div>
                  ⏱️ Prazo até: <span className={`font-semibold ${isPastDeadline ? 'text-tibia-red line-through' : 'text-tibia-green'}`}>
                    {deadlineInfo.deadlineTimeStr}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-tibia-stone">
                  {isPastDeadline ? (
                    <>
                      <div className="text-tibia-red font-bold text-sm mb-1">
                        💰 Valor Total: <span className="text-tibia-gold">{paymentAmount} GP</span>
                      </div>
                      <div className="text-tibia-light-stone text-xs">
                        • 10k pagamento normal
                        <br />
                        • 1k multa para White Widow
                        <br />
                        • 1k multa para quem caguetou
                      </div>
                    </>
                  ) : (
                    <div className="text-tibia-green text-sm">
                      ✓ Pague <span className="text-tibia-gold font-bold">{paymentAmount} GP</span> até {deadlineInfo.deadlineTimeStr} (sem multa)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {paymentType && (
            <>
              <div className="mb-6 p-5 rounded-xl border-2 border-tibia-stone bg-tibia-dark-brown/50">
                <label className="block text-tibia-light-stone mb-3 text-sm font-semibold">
                  📝 Comprovante de Pagamento {isCaguetado && <span className="text-tibia-red">({paymentAmount} GP)</span>}
                </label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="w-full tibia-input text-sm"
                  rows={4}
                  placeholder={`Exemplo: 11:18 Player White Widow deposited ${paymentAmount} gold coins.`}
                  disabled={loading}
                  required
                />
                <div className="mt-2 text-tibia-light-stone text-xs">
                  💡 Cole o texto exato do depósito que aparece no Exordion
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-tibia-red bg-opacity-20 border-2 border-tibia-red rounded-xl text-tibia-red text-sm font-semibold">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 tibia-button bg-tibia-stone hover:bg-tibia-light-stone py-3"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 tibia-button py-3"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
