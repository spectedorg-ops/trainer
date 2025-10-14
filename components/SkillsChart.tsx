'use client'

import { useState, useEffect } from 'react'
import { supabase, SkillHistory } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface SkillsChartProps {
  user: User
}

export default function SkillsChart({ user }: SkillsChartProps) {
  const [skillData, setSkillData] = useState<SkillHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<string>('magic_level')

  useEffect(() => {
    loadSkillData()
  }, [user.id])

  async function loadSkillData() {
    setLoading(true)
    try {
      // Buscar todos os registros do usuário
      const { data, error } = await supabase
        .from('skill_history')
        .select(`
          id,
          user_id,
          axe_level,
          axe_percent,
          club_level,
          club_percent,
          sword_level,
          sword_percent,
          distance_level,
          distance_percent,
          magic_level,
          magic_percent,
          recorded_at
        `)
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: true })

      if (error) throw error
      setSkillData(data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Todas as skills disponíveis para seleção
  const allSkills = ['axe_level', 'club_level', 'sword_level', 'distance_level', 'magic_level']

  const skillNames: Record<string, string> = {
    axe_level: '🪓 Axe Fighting',
    club_level: '🔨 Club Fighting',
    sword_level: '⚔️ Sword Fighting',
    distance_level: '🏹 Distance Fighting',
    magic_level: '✨ Magic Level'
  }

  const skillColors: Record<string, string> = {
    axe_level: '#ef4444', // red
    club_level: '#f59e0b', // amber
    sword_level: '#6366f1', // indigo
    distance_level: '#10b981', // green
    magic_level: '#a855f7' // purple
  }

  // Calcular progresso total em porcentagem
  function calculateProgress(skillName: string): { current: number | null; currentPercent: number | null; start: number | null; gainPercent: number } {
    const relevantData = skillData.filter(d => (d as any)[skillName] !== null)
    if (relevantData.length === 0) return { current: null, currentPercent: null, start: null, gainPercent: 0 }

    const percentField = skillName.replace('_level', '_percent')

    // Dados iniciais
    const startLevel = (relevantData[0] as any)[skillName]
    const startPercent = (relevantData[0] as any)[percentField] || 0

    // Dados finais
    const currentLevel = (relevantData[relevantData.length - 1] as any)[skillName]
    const currentPercent = (relevantData[relevantData.length - 1] as any)[percentField] || 0

    // Calcular progresso total em %
    // Cada nível = 100%, então: (nível_final * 100 + %_final) - (nível_inicial * 100 + %_inicial)
    const startTotal = startLevel * 100 + startPercent
    const currentTotal = currentLevel * 100 + currentPercent
    const gainPercent = currentTotal - startTotal

    return { current: currentLevel, currentPercent, start: startLevel, gainPercent }
  }

  if (loading) {
    return (
      <div className="tibia-panel" style={{padding: '2rem', textAlign: 'center'}}>
        <div className="loading-spinner mx-auto mb-3" style={{margin: '0 auto 0.75rem'}}></div>
        <div className="text-tibia-light-stone">Carregando dados...</div>
      </div>
    )
  }

  if (skillData.length === 0) {
    return (
      <div className="tibia-panel" style={{padding: '2rem', textAlign: 'center'}}>
        <div className="text-4xl mb-3">📊</div>
        <div className="text-tibia-gold font-bold mb-2">Nenhum dado ainda</div>
        <div className="text-tibia-light-stone text-sm">
          Registre seus skills usando o botão "Adicionar Skill Atual" no topo da página
        </div>
      </div>
    )
  }

  // Calcular dias entre primeiro e último registro
  const getDaysInPeriod = () => {
    if (skillData.length < 2) return 1
    const firstDate = new Date(skillData[0].recorded_at)
    const lastDate = new Date(skillData[skillData.length - 1].recorded_at)
    const diffMs = lastDate.getTime() - firstDate.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 1
  }

  // Pegar última atualização
  const lastUpdate = skillData.length > 0 ? skillData[skillData.length - 1].recorded_at : null
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Pegar últimos 10 registros
  const last10Records = skillData.slice(-10).reverse()

  return (
    <div className="tibia-panel" style={{padding: '2rem'}}>
      {/* Header */}
      <div style={{marginBottom: '1.5rem'}}>
        <h3 className="text-tibia-gold font-bold text-xl mb-2" style={{textAlign: 'center'}}>
          📈 Evolução de Skills 📈
        </h3>
        {lastUpdate && (
          <p className="text-center text-tibia-light-stone text-xs mb-3">
            Última atualização: {formatDateTime(lastUpdate)}
          </p>
        )}

        {/* Skill Selector */}
        <div className="flex justify-center gap-2 flex-wrap mt-4">
          {allSkills.map(skillName => (
            <button
              key={skillName}
              onClick={() => setSelectedSkill(skillName)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedSkill === skillName
                  ? 'bg-tibia-gold text-black'
                  : 'bg-tibia-stone hover:bg-tibia-light-stone text-tibia-light-stone'
              }`}
              style={{
                border: selectedSkill === skillName ? '2px solid #cba67d' : '1px solid rgba(139, 92, 54, 0.3)'
              }}
            >
              {skillNames[skillName]}
            </button>
          ))}
        </div>
      </div>

      {/* Layout: Resumo | Últimos Registros */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Coluna Esquerda: Resumo de Evolução da Skill Selecionada */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {(() => {
            const { current, currentPercent, start, gainPercent } = calculateProgress(selectedSkill)

            if (current === null) {
              return (
                <div className="tibia-panel border-tibia-stone" style={{padding: '2rem', textAlign: 'center'}}>
                  <div className="text-4xl mb-3">📊</div>
                  <div className="text-tibia-gold font-bold mb-2">
                    {skillNames[selectedSkill]}
                  </div>
                  <div className="text-tibia-light-stone text-sm">
                    Nenhum registro para esta skill ainda
                  </div>
                </div>
              )
            }

            const days = getDaysInPeriod()
            const avgPerDay = gainPercent / days
            const relevantData = skillData.filter(d => (d as any)[selectedSkill] !== null)
            const sessions = relevantData.length

            return (
              <div className="tibia-panel border-tibia-stone" style={{padding: '1.5rem'}}>
                {/* Skill Name */}
                <div className="text-tibia-light-stone text-sm mb-2">
                  {skillNames[selectedSkill]}
                </div>

                {/* Current Level */}
                <div className="text-5xl font-bold text-tibia-gold mb-1">
                  {current}
                  {currentPercent !== null && currentPercent !== undefined && (
                    <span className="text-2xl text-tibia-light-stone ml-2">
                      ({currentPercent}%)
                    </span>
                  )}
                </div>

                {/* Progress Badge */}
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-3 ${
                  gainPercent >= 0 ? 'bg-tibia-green bg-opacity-20 text-tibia-green' : 'bg-tibia-red bg-opacity-20 text-tibia-red'
                }`}>
                  {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}% total
                </div>

                {/* Insights */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-tibia-light-stone">
                    <span>📊 Média por dia:</span>
                    <span className="text-tibia-gold font-semibold">
                      {avgPerDay >= 0 ? '+' : ''}{avgPerDay.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-tibia-light-stone">
                    <span>🎯 Sessões registradas:</span>
                    <span className="text-tibia-gold font-semibold">{sessions}x</span>
                  </div>
                  {start !== null && (
                    <div className="flex justify-between text-tibia-light-stone">
                      <span>📈 Nível inicial:</span>
                      <span className="text-tibia-gold font-semibold">{start}</span>
                    </div>
                  )}

                  {/* Insight motivacional */}
                  <div className="mt-3 pt-3 border-t border-tibia-stone">
                    <div className="text-tibia-light-stone text-xs">
                      {gainPercent > 0 ? (
                        <>
                          💪 {gainPercent >= 100 ? (
                            <>Você subiu {Math.floor(gainPercent / 100)} nível{Math.floor(gainPercent / 100) > 1 ? 's' : ''}! Incrível!</>
                          ) : gainPercent >= 50 ? (
                            <>Progresso excelente! Continue treinando!</>
                          ) : gainPercent >= 20 ? (
                            <>Bom progresso! Mais {(100 - (gainPercent % 100)).toFixed(0)}% para o próximo nível</>
                          ) : (
                            <>Cada % conta! Continue firme!</>
                          )}
                        </>
                      ) : (
                        <>⏸️ Nenhum progresso registrado</>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Coluna Direita: Últimos 10 Registros */}
        <div>
          <div className="tibia-panel border-tibia-stone" style={{padding: '1.5rem'}}>
            <h4 className="text-tibia-gold font-bold text-lg mb-4">
              📜 Últimos 10 Registros
            </h4>

            {last10Records.length === 0 ? (
              <div className="text-center text-tibia-light-stone py-8">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-sm">Nenhum registro ainda</div>
              </div>
            ) : (
              <div style={{maxHeight: '600px', overflowY: 'auto'}}>
                {last10Records.map((record, index) => (
                  <div
                    key={record.id}
                    className="mb-3 p-3 rounded"
                    style={{
                      background: 'rgba(15, 15, 35, 0.5)',
                      border: '1px solid rgba(139, 92, 54, 0.3)'
                    }}
                  >
                    {/* Data/Hora */}
                    <div className="text-tibia-light-stone text-xs mb-2">
                      🕐 {formatDateTime(record.recorded_at)}
                    </div>

                    {/* Skills */}
                    <div className="space-y-1">
                      {allSkills.map(skillName => {
                        const level = (record as any)[skillName]
                        const percentField = skillName.replace('_level', '_percent')
                        const percent = (record as any)[percentField]

                        if (level === null || level === undefined) return null

                        return (
                          <div key={skillName} className="flex justify-between text-sm">
                            <span className="text-tibia-light-stone">
                              {skillNames[skillName]}
                            </span>
                            <span className="text-tibia-gold font-semibold">
                              {level}
                              {percent !== null && percent !== undefined && (
                                <span className="text-tibia-light-stone ml-1">
                                  ({percent}%)
                                </span>
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
