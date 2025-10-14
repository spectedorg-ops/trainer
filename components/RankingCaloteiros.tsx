'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface CaloteiroRank {
  character_name: string
  total_multas: number
  total_caguetado: number
  ultima_multa: string | null
}

export default function RankingCaloteiros() {
  const [ranking, setRanking] = useState<CaloteiroRank[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
  }, [])

  async function loadRanking() {
    try {
      setLoading(true)

      // Query SQL para buscar players que pagaram com multa (depois de 10 minutos)
      const { data, error } = await supabase.rpc('get_caloteiros_ranking')

      if (error) {
        console.error('Erro ao buscar ranking:', error)
      } else {
        setRanking(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="tibia-panel p-6">
        <div className="text-center text-tibia-light-stone">
          Carregando ranking...
        </div>
      </div>
    )
  }

  if (ranking.length === 0) {
    return (
      <div className="tibia-panel p-8 text-center">
        <div className="text-4xl mb-3">🏆</div>
        <div className="text-tibia-gold font-bold text-lg mb-2">
          Ranking de Caloteiros
        </div>
        <div className="text-tibia-light-stone text-sm">
          Nenhum caloteiro ainda! 🎉
        </div>
        <div className="text-tibia-light-stone text-xs mt-2">
          (Players que não pagaram dentro de 10 minutos após serem caguetados)
        </div>
      </div>
    )
  }

  const getMedalEmoji = (position: number) => {
    if (position === 0) return '🥇'
    if (position === 1) return '🥈'
    if (position === 2) return '🥉'
    return `${position + 1}º`
  }

  const getMedalColor = (position: number) => {
    if (position === 0) return 'text-yellow-400'
    if (position === 1) return 'text-gray-300'
    if (position === 2) return 'text-orange-400'
    return 'text-tibia-light-stone'
  }

  return (
    <div className="tibia-panel p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-tibia-red mb-2">
          🔥 Ranking de Caloteiros 🔥
        </h2>
        <p className="text-tibia-light-stone text-xs">
          Players que mais pagaram multa por atraso (não pagaram em 10 minutos)
        </p>
      </div>

      <div className="space-y-3">
        {ranking.map((player, index) => (
          <div
            key={player.character_name}
            className={`p-4 rounded border ${
              index < 3
                ? 'bg-tibia-red bg-opacity-10 border-tibia-red'
                : 'bg-tibia-stone bg-opacity-20 border-tibia-stone'
            }`}
            style={{
              animation: `fadeIn 0.3s ease-in-out ${index * 0.1}s both`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${getMedalColor(index)}`}>
                  {getMedalEmoji(index)}
                </div>
                <div>
                  <div className="text-tibia-gold font-bold text-lg">
                    {player.character_name}
                  </div>
                  <div className="text-tibia-light-stone text-xs">
                    {player.total_caguetado} vez{player.total_caguetado !== 1 ? 'es' : ''} caguetado
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-tibia-red font-bold text-xl">
                  {player.total_multas} multa{player.total_multas !== 1 ? 's' : ''}
                </div>
                {player.ultima_multa && (
                  <div className="text-tibia-light-stone text-xs mt-1">
                    Última: {new Date(player.ultima_multa).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>

            {index < 3 && (
              <div className="mt-3 pt-3 border-t border-tibia-stone">
                <div className="text-tibia-light-stone text-xs text-center">
                  💸 Total em multas: <span className="text-tibia-red font-bold">{player.total_multas * 2}k GP</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {ranking.length > 0 && (
        <div className="mt-6 pt-4 border-t border-tibia-stone text-center space-y-2">
          <div className="text-tibia-light-stone text-xs">
            ⚠️ <span className="font-semibold">Se foi caguetado:</span> Pague dentro de 10 minutos para não entrar no ranking!
          </div>
          <div className="text-tibia-light-stone text-xs">
            🔥 <span className="font-semibold">Se já passou dos 10 minutos:</span> Você já está com multa ativa! Pague 12k (10k treino + 2k multa)
          </div>
          <div className="text-tibia-light-stone text-xs opacity-70">
            💰 Os 2k da multa vão integralmente para quem caguetou
          </div>
        </div>
      )}
    </div>
  )
}
