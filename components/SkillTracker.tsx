'use client'

import { useState, useEffect } from 'react'
import { supabase, SkillTracking } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface SkillTrackerProps {
  user: User
  onClose: () => void
}

const SKILL_TYPES = [
  { value: 'sword', label: '⚔️ Sword Fighting', icon: '⚔️' },
  { value: 'axe', label: '🪓 Axe Fighting', icon: '🪓' },
  { value: 'club', label: '🔨 Club Fighting', icon: '🔨' },
  { value: 'distance', label: '🏹 Distance Fighting', icon: '🏹' },
  { value: 'magic', label: '✨ Magic Level', icon: '✨' },
  { value: 'shielding', label: '🛡️ Shielding', icon: '🛡️' },
  { value: 'fist', label: '👊 Fist Fighting', icon: '👊' }
]

export default function SkillTracker({ user, onClose }: SkillTrackerProps) {
  const [skillType, setSkillType] = useState('sword')
  const [skillLevel, setSkillLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentSkills, setRecentSkills] = useState<any[]>([])

  useEffect(() => {
    loadRecentSkills()
  }, [])

  async function loadRecentSkills() {
    try {
      const { data, error } = await supabase
        .from('skill_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('skill_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentSkills(data || [])
    } catch (error) {
      console.error('Erro ao carregar skills:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!skillLevel || parseInt(skillLevel) < 0) {
      alert('Digite um nível válido')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('skill_tracking')
        .insert([{
          user_id: user.id,
          skill_type: skillType,
          skill_level: parseInt(skillLevel),
          notes: notes.trim() || null,
          skill_date: new Date().toISOString().split('T')[0]
        }])

      if (error) {
        if (error.code === '23505') {
          alert('Você já registrou este skill hoje. Tente amanhã!')
        } else {
          alert('Erro ao registrar skill: ' + error.message)
        }
        return
      }

      alert('✓ Skill registrado com sucesso!')
      setSkillLevel('')
      setNotes('')
      loadRecentSkills()
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedSkill = SKILL_TYPES.find(s => s.value === skillType)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="tibia-panel p-8 max-w-2xl w-full my-8">
        <h2 className="text-2xl font-bold text-tibia-gold mb-6 text-center">
          📊 Registrar Skill do Dia 📊
        </h2>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label className="block text-tibia-light-stone mb-2 text-sm">
              Tipo de Skill
            </label>
            <select
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
              className="w-full tibia-input"
              disabled={loading}
            >
              {SKILL_TYPES.map(skill => (
                <option key={skill.value} value={skill.value}>
                  {skill.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-tibia-light-stone mb-2 text-sm">
              Nível Atual {selectedSkill?.icon}
            </label>
            <input
              type="number"
              min="0"
              max="200"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="w-full tibia-input"
              placeholder="Ex: 85"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-tibia-light-stone mb-2 text-sm">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full tibia-input"
              placeholder="Ex: Treinei 4 horas hoje"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 tibia-button bg-tibia-stone hover:bg-tibia-light-stone"
              disabled={loading}
            >
              Fechar
            </button>
            <button
              type="submit"
              className="flex-1 tibia-button"
              disabled={loading}
            >
              {loading ? 'Salvando...' : '💾 Salvar Skill'}
            </button>
          </div>
        </form>

        {/* Histórico Recente */}
        {recentSkills.length > 0 && (
          <div className="border-t border-tibia-stone pt-6">
            <h3 className="text-lg font-bold text-tibia-gold mb-4">
              📜 Histórico Recente
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentSkills.map((skill) => {
                const skillInfo = SKILL_TYPES.find(s => s.value === skill.skill_type)
                return (
                  <div
                    key={skill.id}
                    className="tibia-panel p-3 border-tibia-stone flex justify-between items-center"
                  >
                    <div>
                      <div className="text-tibia-gold text-sm">
                        {skillInfo?.icon} {skillInfo?.label.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="text-tibia-light-stone text-xs">
                        {new Date(skill.skill_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-tibia-gold font-bold text-xl">
                      {skill.skill_level}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
