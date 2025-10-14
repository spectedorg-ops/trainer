'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'
import SkillHistoryList from './SkillHistoryList'

interface UpdateSkillsProps {
  user: User
  onClose: () => void
  onSuccess?: () => void
}

export default function UpdateSkills({ user, onClose, onSuccess }: UpdateSkillsProps) {
  const [axeLevel, setAxeLevel] = useState('')
  const [axePercent, setAxePercent] = useState('')
  const [clubLevel, setClubLevel] = useState('')
  const [clubPercent, setClubPercent] = useState('')
  const [swordLevel, setSwordLevel] = useState('')
  const [swordPercent, setSwordPercent] = useState('')
  const [distanceLevel, setDistanceLevel] = useState('')
  const [distancePercent, setDistancePercent] = useState('')
  const [magicLevel, setMagicLevel] = useState('')
  const [magicPercent, setMagicPercent] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Todas vocações podem registrar todas as skills
  const showAllSkills = true

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validar que pelo menos um skill foi preenchido
    const hasAnySkill = axeLevel || clubLevel || swordLevel || distanceLevel || magicLevel
    if (!hasAnySkill) {
      alert('Preencha pelo menos um skill')
      return
    }

    // Validar ranges
    const validateSkill = (level: string, percent: string, name: string) => {
      if (level) {
        const lvl = parseInt(level)
        if (lvl < 0 || lvl > 200) {
          alert(`${name}: nível deve estar entre 0 e 200`)
          return false
        }
      }
      if (percent) {
        const pct = parseInt(percent)
        if (pct < 0 || pct > 99) {
          alert(`${name}: porcentagem deve estar entre 0 e 99`)
          return false
        }
      }
      return true
    }

    if (!validateSkill(axeLevel, axePercent, 'Axe')) return
    if (!validateSkill(clubLevel, clubPercent, 'Club')) return
    if (!validateSkill(swordLevel, swordPercent, 'Sword')) return
    if (!validateSkill(distanceLevel, distancePercent, 'Distance')) return
    if (!validateSkill(magicLevel, magicPercent, 'Magic Level')) return

    setLoading(true)

    try {
      // Salvar no skill_history
      const { error } = await supabase
        .from('skill_history')
        .insert([{
          user_id: user.id,
          axe_level: axeLevel ? parseInt(axeLevel) : null,
          axe_percent: axePercent ? parseInt(axePercent) : null,
          club_level: clubLevel ? parseInt(clubLevel) : null,
          club_percent: clubPercent ? parseInt(clubPercent) : null,
          sword_level: swordLevel ? parseInt(swordLevel) : null,
          sword_percent: swordPercent ? parseInt(swordPercent) : null,
          distance_level: distanceLevel ? parseInt(distanceLevel) : null,
          distance_percent: distancePercent ? parseInt(distancePercent) : null,
          magic_level: magicLevel ? parseInt(magicLevel) : null,
          magic_percent: magicPercent ? parseInt(magicPercent) : null
        }])

      if (error) {
        alert('Erro ao salvar skills: ' + error.message)
        return
      }

      alert('✓ Skills atualizados com sucesso!')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
      }}
      onClick={onClose}
    >
      <div
        className="p-8 max-w-md w-full relative"
        style={{
          background: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(203, 166, 125, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glass shine effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(180deg, rgba(203, 166, 125, 0.1), transparent)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(203, 166, 125, 0.5), transparent)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '1px',
            background: 'linear-gradient(180deg, rgba(203, 166, 125, 0.3), transparent)'
          }}
        />
        <div style={{position: 'relative', zIndex: 1}} onClick={(e) => e.stopPropagation()}>
        {/* Botão X para fechar */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-tibia-gold hover:text-tibia-light-gold transition-colors z-10"
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
          📊 Atualizar Skills 📊
        </h2>
        <p className="text-tibia-light-stone text-center text-sm mb-6">
          {user.character_name} - {
            user.vocation === 'MS' ? '🔮 Master Sorcerer' :
            user.vocation === 'ED' ? '🌿 Elder Druid' :
            user.vocation === 'EK' ? '⚔️ Elite Knight' :
            '🏹 Royal Paladin'
          }
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-tibia-light-stone mb-2 text-sm">
              🪓 Axe Fighting
            </label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input
                type="number"
                min="0"
                max="200"
                value={axeLevel}
                onChange={(e) => setAxeLevel(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 2,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="Nível (ex: 100)"
                disabled={loading}
              />
              <input
                type="number"
                min="0"
                max="99"
                value={axePercent}
                onChange={(e) => setAxePercent(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 1,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="% (ex: 45)"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-tibia-light-stone mb-2 text-sm">
              🔨 Club Fighting
            </label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input
                type="number"
                min="0"
                max="200"
                value={clubLevel}
                onChange={(e) => setClubLevel(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 2,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="Nível (ex: 100)"
                disabled={loading}
              />
              <input
                type="number"
                min="0"
                max="99"
                value={clubPercent}
                onChange={(e) => setClubPercent(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 1,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="% (ex: 45)"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-tibia-light-stone mb-2 text-sm">
              ⚔️ Sword Fighting
            </label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input
                type="number"
                min="0"
                max="200"
                value={swordLevel}
                onChange={(e) => setSwordLevel(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 2,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="Nível (ex: 100)"
                disabled={loading}
              />
              <input
                type="number"
                min="0"
                max="99"
                value={swordPercent}
                onChange={(e) => setSwordPercent(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 1,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="% (ex: 45)"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-tibia-light-stone mb-2 text-sm">
              🏹 Distance Fighting
            </label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input
                type="number"
                min="0"
                max="200"
                value={distanceLevel}
                onChange={(e) => setDistanceLevel(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 2,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="Nível (ex: 110)"
                disabled={loading}
              />
              <input
                type="number"
                min="0"
                max="99"
                value={distancePercent}
                onChange={(e) => setDistancePercent(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 1,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="% (ex: 45)"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-tibia-light-stone mb-2 text-sm">
              ✨ Magic Level
            </label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input
                type="number"
                min="0"
                max="200"
                value={magicLevel}
                onChange={(e) => setMagicLevel(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 2,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="Nível (ex: 85)"
                disabled={loading}
              />
              <input
                type="number"
                min="0"
                max="99"
                value={magicPercent}
                onChange={(e) => setMagicPercent(e.target.value)}
                className="tibia-input"
                style={{
                  flex: 1,
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(203, 166, 125, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="% (ex: 45)"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="flex-1 tibia-button bg-tibia-stone hover:bg-tibia-light-stone"
              style={{
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
              }}
              disabled={loading}
            >
              📜 Ver Histórico
            </button>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 tibia-button bg-tibia-stone hover:bg-tibia-light-stone"
              style={{
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
              }}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 tibia-button"
              style={{
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px 0 rgba(203, 166, 125, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
              }}
              disabled={loading}
            >
              {loading ? 'Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </form>
        </div>

        {showHistory && (
          <SkillHistoryList
            user={user}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </div>
  )
}
