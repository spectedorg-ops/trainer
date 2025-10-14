'use client'

import { useEffect, useState } from 'react'
import { supabase, PlayerActivity } from '@/lib/supabase'
import { User, getSession, clearSession } from '@/lib/auth'
import PlayerCard from '@/components/PlayerCardImproved'
import RegisterPlayer from '@/components/RegisterPlayer'
import AddPayment from '@/components/AddPayment'
import LoginModal from '@/components/LoginModal'
import UpdateSkills from '@/components/UpdateSkills'
import SkillsChart from '@/components/SkillsChart'
import PlayersList from '@/components/PlayersList'
import EarningsCard from '@/components/EarningsCard'
import RankingCaloteiros from '@/components/RankingCaloteiros'
import AdminPagamentosCaguetas from '@/components/AdminPagamentosCaguetas'
import MyPayments from '@/components/MyPayments'
import { getTrainingDayStart, getNextResetTime } from '@/lib/dateUtils'

export default function Home() {
  const [players, setPlayers] = useState<PlayerActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showUpdateSkills, setShowUpdateSkills] = useState(false)
  const [showPlayersList, setShowPlayersList] = useState(false)
  const [showAdminPagamentos, setShowAdminPagamentos] = useState(false)
  const [showMyPayments, setShowMyPayments] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [todayPaymentsCount, setTodayPaymentsCount] = useState(0)
  const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday'>('today')

  useEffect(() => {
    // Verificar sessão salva
    const session = getSession()
    setCurrentUser(session)
    setCheckingAuth(false)

    if (session) {
      loadPlayers()
    }
  }, [])

  // Recarregar quando mudar o filtro de data
  useEffect(() => {
    if (currentUser) {
      loadPlayers()
    }
  }, [selectedDate])

  // Função para obter o timestamp baseado no filtro selecionado
  function getFilteredDayStart() {
    if (selectedDate === 'today') {
      return getTrainingDayStart()
    } else {
      // yesterday
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(10, 0, 0, 0)
      return yesterday
    }
  }

  function getFilteredDayEnd() {
    const dayStart = getFilteredDayStart()
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    return dayEnd
  }

  async function loadPlayers() {
    try {
      setLoading(true)

      // Obter timestamp do início e fim do dia de treino baseado no filtro
      const dayStart = getFilteredDayStart()
      const dayEnd = getFilteredDayEnd()

      // Se estiver vendo "hoje", usar a view player_activity (dados em tempo real)
      if (selectedDate === 'today') {
        const { data: allPlayers, error: playersError } = await supabase
          .from('player_activity')
          .select('*')
          .order('character_name')

        if (playersError) {
          console.error('Erro Supabase:', playersError)
          throw playersError
        }

        // Buscar pagamentos de hoje
        const { data: todayPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('player_id, created_at')
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString())

        if (paymentsError) {
          console.error('Erro ao buscar pagamentos:', paymentsError)
          throw paymentsError
        }

        const visiblePlayers = (allPlayers || []).filter(p => !p.hidden)
        setPlayers(visiblePlayers)
        setTodayPaymentsCount(todayPayments?.length || 0)
      } else {
        // Para datas históricas (ontem, custom), buscar apenas quem pagou naquele dia
        const { data: periodPayments, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            player_id,
            created_at,
            players!inner(
              id,
              character_name,
              hidden,
              caguetado_at,
              caguetado_by_user_id
            )
          `)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString())
          .order('players(character_name)')

        if (paymentsError) {
          console.error('Erro ao buscar pagamentos:', paymentsError)
          throw paymentsError
        }

        // Agrupar pagamentos por player
        const playersMap = new Map()

        periodPayments?.forEach((payment: any) => {
          if (payment.players.hidden) return // Skip hidden players

          const playerId = payment.players.id
          if (!playersMap.has(playerId)) {
            playersMap.set(playerId, {
              id: playerId,
              character_name: payment.players.character_name,
              paid_today: true, // Pagou nesse dia histórico
              total_payments: 1,
              last_payment_date: payment.created_at,
              caguetado_at: payment.players.caguetado_at,
              caguetado_by_user_id: payment.players.caguetado_by_user_id,
              hidden: payment.players.hidden
            })
          } else {
            const player = playersMap.get(playerId)
            player.total_payments++
            // Manter o último pagamento
            if (new Date(payment.created_at) > new Date(player.last_payment_date)) {
              player.last_payment_date = payment.created_at
            }
          }
        })

        const historicalPlayers = Array.from(playersMap.values())
        setPlayers(historicalPlayers)
        setTodayPaymentsCount(periodPayments?.length || 0)
      }
    } catch (error: any) {
      console.error('Erro ao carregar jogadores:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleLogin(user: User) {
    console.log('=== LOGIN DEBUG ===')
    console.log('User logged in:', user)
    console.log('is_admin:', user.is_admin)
    console.log('typeof is_admin:', typeof user.is_admin)
    setCurrentUser(user)
    loadPlayers()
  }

  function handleLogout() {
    clearSession()
    setCurrentUser(null)
  }

  // Cálculos financeiros
  const PAYMENT_VALUE = 10000 // 10k por pagamento
  const DUMMY_COST = 140000 // 140k custo do dummy
  const totalRevenue = todayPaymentsCount * PAYMENT_VALUE
  const profit = totalRevenue - DUMMY_COST
  const isProfit = profit >= 0

  // Mostrar tela de login se não estiver autenticado
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-white/70 text-xl">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div>
        <LoginModal
          onClose={() => {}} // Não pode fechar sem fazer login
          onSuccess={handleLogin}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Header com Botões de Ação */}
      <div className="mb-8 tibia-panel p-6">
        {/* User Info */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="text-3xl">👤</div>
            <div>
              <div className="text-white font-bold text-lg">{currentUser.character_name}</div>
              <div className="text-tibia-light-stone text-xs">
                {currentUser.is_admin ? '⚡ Admin' : '📊 Player'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="tibia-button bg-tibia-stone hover:bg-tibia-light-stone px-4 py-2"
            style={{fontSize: '0.875rem'}}
          >
            🚪 Sair
          </button>
        </div>

        {/* Action Buttons - Grid Responsivo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}>
          <button
            onClick={() => setShowRegister(true)}
            className="tibia-button py-3 flex flex-col items-center gap-1"
            title="Caguetar"
          >
            <span style={{fontSize: '1.5rem'}}>👁️</span>
            <span style={{fontSize: '0.75rem'}}>Caguetar</span>
          </button>
          <button
            onClick={() => setShowAddPayment(true)}
            className="tibia-button py-3 flex flex-col items-center gap-1"
            title="Registrar Pagamento"
          >
            <span style={{fontSize: '1.5rem'}}>💳</span>
            <span style={{fontSize: '0.75rem'}}>Pagamento</span>
          </button>
          <button
            onClick={() => setShowMyPayments(true)}
            className="tibia-button py-3 flex flex-col items-center gap-1"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
            title="Meus Pagamentos"
          >
            <span style={{fontSize: '1.5rem'}}>💰</span>
            <span style={{fontSize: '0.75rem'}}>Meus Pagamentos</span>
          </button>
          <button
            onClick={() => setShowPlayersList(true)}
            className="tibia-button py-3 flex flex-col items-center gap-1"
            title="Lista de Players"
          >
            <span style={{fontSize: '1.5rem'}}>👥</span>
            <span style={{fontSize: '0.75rem'}}>Players</span>
          </button>
          <button
            onClick={() => setShowUpdateSkills(true)}
            className="tibia-button py-3 flex flex-col items-center gap-1"
            title="Adicionar Skill Atual"
          >
            <span style={{fontSize: '1.5rem'}}>📈</span>
            <span style={{fontSize: '0.75rem'}}>Skills</span>
          </button>
          {currentUser?.is_admin && (
            <button
              onClick={() => setShowAdminPagamentos(true)}
              className="tibia-button py-3 flex flex-col items-center gap-1"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
              title="Controle Caguetas"
            >
              <span style={{fontSize: '1.5rem'}}>💰</span>
              <span style={{fontSize: '0.75rem'}}>Caguetas</span>
            </button>
          )}
          <button
            onClick={loadPlayers}
            className="tibia-button bg-tibia-stone hover:bg-tibia-light-stone py-3 flex flex-col items-center gap-1"
            title="Atualizar"
          >
            <span style={{fontSize: '1.5rem'}}>🔄</span>
            <span style={{fontSize: '0.75rem'}}>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Informações e Statistics - Topo */}
      <div className="mb-8 tibia-panel p-6">
        {/* Regras de Pagamento */}
        <div className="mb-6 p-8 rounded-xl border-2 border-tibia-stone bg-tibia-dark-brown/40">
          <h3 className="text-center text-2xl font-bold text-tibia-gold mb-6 flex items-center justify-center gap-3">
            <span className="text-3xl">📜</span>
            Regras do Training Manager
            <span className="text-3xl">📜</span>
          </h3>

          <div className="space-y-4 text-tibia-light-stone">
            <div className="p-5 rounded-lg bg-tibia-dark-brown/60 border border-tibia-stone">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-bold text-tibia-gold mb-1">Pagamento Obrigatório</div>
                  <div className="text-sm">
                    Antes de entrar no treino você deve enviar <span className="font-bold text-tibia-gold">10k</span> para <span className="font-bold text-tibia-gold">White Widow</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-tibia-dark-brown/60 border border-tibia-stone">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-bold text-red-400 mb-1">Multa por Atraso</div>
                  <div className="text-sm">
                    Caso entrar sem pagar e outra pessoa ver, você tem <span className="font-bold text-tibia-gold">10 minutos</span> para pagar.
                    Se não pagar, vira uma multa de <span className="font-bold text-red-400">+2k (total 12k)</span>.
                    A pessoa que te denunciou recebe a multa.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-tibia-dark-brown/60 border border-tibia-stone">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <div className="font-bold text-tibia-gold mb-1">Horário de Pagamento</div>
                  <div className="text-sm">
                    Pagamento todo dia às <span className="font-bold text-tibia-gold">10h</span> (server save).
                    O pagamento é por server save, não a cada 24h.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-tibia-dark-brown/60 border border-tibia-stone">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💸</span>
                <div>
                  <div className="font-bold text-green-400 mb-1">Pagamento aos Caguetas</div>
                  <div className="text-sm">
                    Pagamento aos caguetas toda <span className="font-bold text-green-400">sexta-feira</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" style={{margin: '1.5rem 0'}} />

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold text-tibia-gold mb-1">
              {(totalRevenue / 1000).toFixed(0)}k
            </div>
            <div className="text-tibia-light-stone text-sm">
              Valor Arrecadado Hoje
            </div>
            <div className="text-tibia-light-stone text-xs mt-1 opacity-70">
              {todayPaymentsCount} pagamento{todayPaymentsCount !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-3xl font-bold text-tibia-red mb-1">
              140k
            </div>
            <div className="text-tibia-light-stone text-sm">
              Custo do Dummy
            </div>
            <div className="text-tibia-light-stone text-xs mt-1 opacity-70">
              Custo fixo diário
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-2">{isProfit ? '📈' : '📉'}</div>
            <div className={`text-3xl font-bold mb-1 ${isProfit ? 'text-tibia-green' : 'text-tibia-red'}`}>
              {isProfit ? '+' : ''}{(profit / 1000).toFixed(0)}k
            </div>
            <div className="text-tibia-light-stone text-sm">
              {isProfit ? 'Lucro do Dia' : 'Custo do White Widow'}
            </div>
            <div className={`text-xs mt-1 font-semibold ${isProfit ? 'text-tibia-green' : 'text-tibia-red'}`}>
              {isProfit ? '🎉 No lucro!' : '⚠️ Prejuízo'}
            </div>
          </div>
        </div>
      </div>

      {/* Controle de Pagamentos - Movido para o topo */}
      <div className="mb-10">
        <div className="tibia-panel" style={{padding: '2.5rem', border: '2px solid rgba(255, 255, 255, 0.1)'}}>
          {/* Título */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-5xl">📋</div>
            <h3 className="text-4xl font-bold gradient-text" style={{textAlign: 'center'}}>
              Controle de Pagamentos
            </h3>
            <div className="text-5xl">📋</div>
          </div>

          {/* Filtro de Data */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setSelectedDate('today')}
              className={`px-10 py-4 rounded-xl font-bold text-lg transition-all border-2 ${
                selectedDate === 'today'
                  ? 'bg-tibia-gold text-white border-tibia-gold shadow-lg'
                  : 'bg-tibia-dark-brown border-tibia-stone text-tibia-light-stone hover:bg-tibia-stone hover:border-tibia-light-stone'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">☀️</span>
                <span>Hoje</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedDate('yesterday')}
              className={`px-10 py-4 rounded-xl font-bold text-lg transition-all border-2 ${
                selectedDate === 'yesterday'
                  ? 'bg-tibia-gold text-white border-tibia-gold shadow-lg'
                  : 'bg-tibia-dark-brown border-tibia-stone text-tibia-light-stone hover:bg-tibia-stone hover:border-tibia-light-stone'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌙</span>
                <span>Ontem</span>
              </div>
            </button>
          </div>

          <div className="divider" style={{margin: '2rem 0'}} />

          {/* Legend Grid - 3 colunas fixas para desktop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* PAGO */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="badge badge-success" style={{fontSize: '0.75rem'}}>
                <span>✓</span>
                <span>PAGO</span>
              </div>
              <div style={{flex: 1, textAlign: 'left'}}>
                <div className="text-tibia-light-stone" style={{fontSize: '0.875rem', fontWeight: 600}}>
                  Pagou hoje
                </div>
                <div className="text-tibia-green" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>
                  10k GP
                </div>
              </div>
            </div>

            {/* CAGUETADO */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="badge badge-danger" style={{fontSize: '0.75rem'}}>
                <span>👁️</span>
                <span>CAGUETADO</span>
              </div>
              <div style={{flex: 1, textAlign: 'left'}}>
                <div className="text-tibia-light-stone" style={{fontSize: '0.875rem', fontWeight: 600}}>
                  Não pagou ainda
                </div>
                <div className="text-tibia-gold" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>
                  10 min de prazo
                </div>
              </div>
            </div>

            {/* MULTA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '2px solid rgba(245, 158, 11, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="badge badge-danger status-critical" style={{fontSize: '0.75rem'}}>
                <span>💰</span>
                <span>MULTA</span>
              </div>
              <div style={{flex: 1, textAlign: 'left'}}>
                <div className="text-tibia-light-stone" style={{fontSize: '0.875rem', fontWeight: 600}}>
                  Passou dos 10 min
                </div>
                <div className="text-tibia-red" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>
                  12k GP (10k + 2k multa)
                </div>
              </div>
            </div>
          </div>

          {/* Player Cards */}
          {loading ? (
            <div className="text-center py-12">
              <div className="loading-spinner mx-auto mb-3"></div>
              <div className="text-white/70">Carregando...</div>
            </div>
          ) : players.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <div className="text-tibia-light-stone text-lg mb-4">
                Nenhum player cadastrado ainda
              </div>
              <div className="text-tibia-light-stone text-sm">
                Use "Caguetar" para adicionar players ao sistema
              </div>
              <div className="text-tibia-light-stone text-xs mt-3">
                💡 Todo player cadastrado aparece aqui como CAGUETADO até fazer o pagamento do dia
              </div>
            </div>
          ) : (
            <div className="players-grid">
              {players.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  currentUser={currentUser}
                  onUpdate={loadPlayers}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skills Chart */}
      <div style={{marginBottom: '2.5rem'}}>
        <SkillsChart user={currentUser} />
      </div>

      {/* Earnings Card */}
      <div className="mb-6">
        <EarningsCard currentUser={currentUser} />
      </div>

      {/* Modais */}
      {showUpdateSkills && (
        <UpdateSkills
          user={currentUser}
          onClose={() => setShowUpdateSkills(false)}
          onSuccess={() => {
            setShowUpdateSkills(false)
            loadPlayers()
          }}
        />
      )}

      {showRegister && (
        <RegisterPlayer
          currentUser={currentUser}
          onClose={() => setShowRegister(false)}
          onSuccess={() => {
            setShowRegister(false)
            loadPlayers()
          }}
        />
      )}

      {showAddPayment && (
        <AddPayment
          players={players}
          currentUser={currentUser}
          onClose={() => setShowAddPayment(false)}
          onSuccess={() => {
            setShowAddPayment(false)
            loadPlayers()
          }}
        />
      )}

      {showPlayersList && (
        <PlayersList
          currentUser={currentUser}
          onClose={() => setShowPlayersList(false)}
        />
      )}

      {showAdminPagamentos && (
        <AdminPagamentosCaguetas
          currentUser={currentUser}
          onClose={() => setShowAdminPagamentos(false)}
        />
      )}

      {showMyPayments && (
        <MyPayments
          currentUser={currentUser}
          onClose={() => setShowMyPayments(false)}
        />
      )}

      {/* Ranking de Caloteiros */}
      <div className="mt-8">
        <RankingCaloteiros />
      </div>
    </div>
  )
}
