'use client'

import { useState } from 'react'
import { login, register, saveSession, User } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface LoginModalProps {
  onClose: () => void
  onSuccess: (user: User) => void
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [characterName, setCharacterName] = useState('')
  const [password, setPassword] = useState('')
  const [vocation, setVocation] = useState<'MS' | 'ED' | 'EK' | 'RP'>('EK')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Skills state
  const [swordLevel, setSwordLevel] = useState('')
  const [swordPercent, setSwordPercent] = useState('')
  const [clubLevel, setClubLevel] = useState('')
  const [clubPercent, setClubPercent] = useState('')
  const [axeLevel, setAxeLevel] = useState('')
  const [axePercent, setAxePercent] = useState('')
  const [distanceLevel, setDistanceLevel] = useState('')
  const [distancePercent, setDistancePercent] = useState('')
  const [shieldingLevel, setShieldingLevel] = useState('')
  const [shieldingPercent, setShieldingPercent] = useState('')
  const [magicLevel, setMagicLevel] = useState('')
  const [magicPercent, setMagicPercent] = useState('')
  const [agreeToRules, setAgreeToRules] = useState(false)

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!characterName.trim()) {
      setError('Digite o nome do personagem')
      return
    }

    if (password.length < 4) {
      setError('Senha deve ter no mínimo 4 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const user = await login(characterName.trim(), password)

      if (user) {
        saveSession(user)
        onSuccess(user)
      } else {
        setError('Nome ou senha incorretos')
      }
    } catch (err: any) {
      setError('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!characterName.trim()) {
      setError('Digite o nome do personagem')
      return
    }

    if (password.length < 4) {
      setError('Senha deve ter no mínimo 4 caracteres')
      return
    }

    if (!agreeToRules) {
      setError('Você precisa concordar com as regras para se registrar')
      return
    }

    // Validar que pelo menos um skill foi preenchido
    const hasAnySkill = swordLevel || clubLevel || axeLevel || distanceLevel || magicLevel || shieldingLevel

    if (!hasAnySkill) {
      setError('Preencha pelo menos um skill para trackear')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Register user
      const result = await register(characterName.trim(), password, vocation)

      if (!result.success) {
        setError(result.error || 'Erro ao registrar')
        return
      }

      // Login to get user ID
      const user = await login(characterName.trim(), password)

      if (!user) {
        setError('Erro ao fazer login após registro')
        return
      }

      // Save skills
      const skillData: any = {
        user_id: user.id,
        recorded_at: new Date().toISOString()
      }

      if (swordLevel) {
        skillData.sword_level = parseInt(swordLevel)
        if (swordPercent) skillData.sword_percent = parseInt(swordPercent)
      }
      if (clubLevel) {
        skillData.club_level = parseInt(clubLevel)
        if (clubPercent) skillData.club_percent = parseInt(clubPercent)
      }
      if (axeLevel) {
        skillData.axe_level = parseInt(axeLevel)
        if (axePercent) skillData.axe_percent = parseInt(axePercent)
      }
      if (distanceLevel) {
        skillData.distance_level = parseInt(distanceLevel)
        if (distancePercent) skillData.distance_percent = parseInt(distancePercent)
      }
      if (shieldingLevel) {
        skillData.shielding_level = parseInt(shieldingLevel)
        if (shieldingPercent) skillData.shielding_percent = parseInt(shieldingPercent)
      }
      if (magicLevel) {
        skillData.magic_level = parseInt(magicLevel)
        if (magicPercent) skillData.magic_percent = parseInt(magicPercent)
      }

      const { error: insertError } = await supabase
        .from('skill_history')
        .insert([skillData])

      if (insertError) {
        console.error('Erro ao salvar skills:', insertError)
        // Não bloquear o registro se falhar ao salvar skills
      }

      saveSession(user)
      onSuccess(user)
    } catch (err: any) {
      setError('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <div
        className="w-full my-8"
        style={{
          maxWidth: isLogin ? '450px' : '900px',
          transition: 'max-width 0.3s ease'
        }}
      >
        <div
          className="tibia-panel p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(40, 30, 20, 0.98), rgba(30, 20, 10, 0.98))',
            border: '3px solid #8B7355',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-tibia-gold mb-2">
              {isLogin ? '🎮 Login' : '✨ Criar Conta'}
            </h2>
            <p className="text-tibia-light-stone text-sm">
              {isLogin ? 'Entre com suas credenciais' : 'Preencha todos os dados para começar'}
            </p>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-tibia-gold mb-2 text-sm font-bold">
                    👤 Nome do Personagem
                  </label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="w-full tibia-input"
                    placeholder="Digite seu nome"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-tibia-gold mb-2 text-sm font-bold">
                    🔒 Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full tibia-input"
                    placeholder="Digite sua senha"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500 bg-opacity-20 border-2 border-red-500 rounded text-red-400 text-sm font-bold text-center">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full tibia-button text-lg py-3"
                  disabled={loading}
                >
                  {loading ? '⏳ Entrando...' : '🚀 Entrar'}
                </button>

                <div className="text-center pt-4 border-t border-tibia-stone">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false)
                      setError('')
                    }}
                    className="text-tibia-gold hover:text-tibia-light-gold text-sm font-bold"
                    disabled={loading}
                  >
                    ➕ Criar nova conta
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Account Info */}
                <div className="space-y-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      background: 'rgba(139, 115, 85, 0.15)',
                      border: '2px solid rgba(139, 115, 85, 0.4)'
                    }}
                  >
                    <h3 className="text-tibia-gold font-bold mb-4 text-center">
                      📝 Informações da Conta
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-tibia-light-stone mb-1 text-xs font-bold">
                          👤 Nome do Personagem
                        </label>
                        <input
                          type="text"
                          value={characterName}
                          onChange={(e) => setCharacterName(e.target.value)}
                          className="w-full tibia-input"
                          placeholder="Digite seu nome"
                          disabled={loading}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-tibia-light-stone mb-1 text-xs font-bold">
                          🔒 Senha (mín. 4 caracteres)
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full tibia-input"
                          placeholder="Digite sua senha"
                          disabled={loading}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-tibia-light-stone mb-1 text-xs font-bold">
                          ⚔️ Vocação
                        </label>
                        <select
                          value={vocation}
                          onChange={(e) => setVocation(e.target.value as 'MS' | 'ED' | 'EK' | 'RP')}
                          className="w-full tibia-input"
                          disabled={loading}
                        >
                          <option value="EK">⚔️ Elite Knight</option>
                          <option value="RP">🏹 Royal Paladin</option>
                          <option value="MS">🔮 Master Sorcerer</option>
                          <option value="ED">🌿 Elder Druid</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Skills */}
                <div className="space-y-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      background: 'rgba(139, 115, 85, 0.15)',
                      border: '2px solid rgba(139, 115, 85, 0.4)'
                    }}
                  >
                    <h3 className="text-tibia-gold font-bold mb-2 text-center">
                      📊 Skills Iniciais
                    </h3>
                    <p className="text-tibia-light-stone text-xs text-center mb-4 opacity-80">
                      Preencha apenas os que você quer trackear
                    </p>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {/* Sword */}
                      <div>
                        <label className="block text-tibia-light-stone mb-1 text-xs">
                          🗡️ Sword
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={swordLevel}
                            onChange={(e) => setSwordLevel(e.target.value)}
                            className="tibia-input text-sm flex-1"
                            placeholder="Nível"
                            disabled={loading}
                          />
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={swordPercent}
                            onChange={(e) => setSwordPercent(e.target.value)}
                            className="tibia-input text-sm w-16"
                            placeholder="%"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Club */}
                      <div>
                        <label className="block text-tibia-light-stone mb-1 text-xs">
                          🔨 Club
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={clubLevel}
                            onChange={(e) => setClubLevel(e.target.value)}
                            className="tibia-input text-sm flex-1"
                            placeholder="Nível"
                            disabled={loading}
                          />
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={clubPercent}
                            onChange={(e) => setClubPercent(e.target.value)}
                            className="tibia-input text-sm w-16"
                            placeholder="%"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Axe */}
                      <div>
                        <label className="block text-tibia-light-stone mb-1 text-xs">
                          🪓 Axe
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={axeLevel}
                            onChange={(e) => setAxeLevel(e.target.value)}
                            className="tibia-input text-sm flex-1"
                            placeholder="Nível"
                            disabled={loading}
                          />
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={axePercent}
                            onChange={(e) => setAxePercent(e.target.value)}
                            className="tibia-input text-sm w-16"
                            placeholder="%"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Distance */}
                      <div>
                        <label className="block text-tibia-light-stone mb-1 text-xs">
                          🏹 Distance
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={distanceLevel}
                            onChange={(e) => setDistanceLevel(e.target.value)}
                            className="tibia-input text-sm flex-1"
                            placeholder="Nível"
                            disabled={loading}
                          />
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={distancePercent}
                            onChange={(e) => setDistancePercent(e.target.value)}
                            className="tibia-input text-sm w-16"
                            placeholder="%"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Shielding */}
                      <div>
                        <label className="block text-tibia-light-stone mb-1 text-xs">
                          🛡️ Shielding
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={shieldingLevel}
                            onChange={(e) => setShieldingLevel(e.target.value)}
                            className="tibia-input text-sm flex-1"
                            placeholder="Nível"
                            disabled={loading}
                          />
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={shieldingPercent}
                            onChange={(e) => setShieldingPercent(e.target.value)}
                            className="tibia-input text-sm w-16"
                            placeholder="%"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Magic */}
                      <div>
                        <label className="block text-tibia-light-stone mb-1 text-xs">
                          ✨ Magic Level
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={magicLevel}
                            onChange={(e) => setMagicLevel(e.target.value)}
                            className="tibia-input text-sm flex-1"
                            placeholder="Nível"
                            disabled={loading}
                          />
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={magicPercent}
                            onChange={(e) => setMagicPercent(e.target.value)}
                            className="tibia-input text-sm w-16"
                            placeholder="%"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regras do Training Manager */}
              <div className="mt-6 p-5 rounded-xl border-2 border-tibia-gold/30 bg-tibia-dark-brown/30"
                style={{
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h4 className="text-tibia-gold font-bold text-center mb-3 flex items-center justify-center gap-2">
                  <span className="text-xl">📜</span>
                  Regras do Training Manager
                  <span className="text-xl">📜</span>
                </h4>

                <div className="space-y-2 text-tibia-light-stone text-xs mb-4">
                  <div className="flex items-start gap-2 p-2 rounded bg-tibia-dark-brown/50">
                    <span>💰</span>
                    <div>
                      <strong className="text-tibia-gold">Pagamento:</strong> Antes de entrar no treino você deve enviar <strong>10k</strong> para <strong>White Widow</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/30">
                    <span>⚠️</span>
                    <div>
                      <strong className="text-red-400">Multa:</strong> Se entrar sem pagar e for denunciado, você tem <strong>10 minutos</strong> para pagar. Caso contrário, vira multa de <strong>+2k (total 12k)</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded bg-tibia-dark-brown/50">
                    <span>⏰</span>
                    <div>
                      <strong className="text-tibia-gold">Horário:</strong> Pagamento todo dia às <strong>10h</strong> (server save, não a cada 24h)
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded bg-green-500/10 border border-green-500/30">
                    <span>💸</span>
                    <div>
                      <strong className="text-green-400">Caguetas:</strong> Pagamento aos caguetas toda <strong>sexta-feira</strong>
                    </div>
                  </div>
                </div>

                {/* Checkbox de concordância */}
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-tibia-dark-brown/50 border-2 border-tibia-gold/20 hover:border-tibia-gold/40 transition-all">
                  <input
                    type="checkbox"
                    checked={agreeToRules}
                    onChange={(e) => setAgreeToRules(e.target.checked)}
                    className="mt-1"
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#CBA67D'
                    }}
                    disabled={loading}
                  />
                  <span className="text-tibia-light-stone text-sm font-bold">
                    ✅ Li e concordo com as regras do Training Manager
                  </span>
                </label>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border-2 border-red-500 rounded text-red-400 text-sm font-bold text-center">
                  ⚠️ {error}
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true)
                    setError('')
                  }}
                  className="flex-1 tibia-button bg-tibia-stone hover:bg-tibia-light-stone text-base py-3"
                  disabled={loading}
                >
                  ◀️ Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 tibia-button text-base py-3"
                  disabled={loading}
                >
                  {loading ? '⏳ Criando...' : '🚀 Criar Conta'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
