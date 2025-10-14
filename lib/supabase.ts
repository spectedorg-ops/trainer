import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos do banco de dados
export interface Player {
  id: string
  character_name: string
  created_at: string
}

export interface Payment {
  id: string
  player_id: string
  payment_date: string
  screenshot_url: string | null
  proof_text: string | null
  paid_by_user_id: string | null
  created_at: string
  player?: Player
  paid_by?: {
    character_name: string
  }
}

export interface User {
  id: string
  character_name: string
  created_at: string
}

export interface CheckIn {
  id: string
  reporter_id: string
  player_id: string
  check_in_date: string
  created_at: string
}

export interface SkillTracking {
  id: string
  user_id: string
  skill_date: string
  skill_level: number
  skill_type: 'sword' | 'axe' | 'club' | 'distance' | 'magic' | 'shielding' | 'fist'
  notes?: string
  created_at: string
}

export interface SkillHistory {
  id: string
  user_id: string
  sword_level: number | null
  sword_percent: number | null
  club_level: number | null
  club_percent: number | null
  axe_level: number | null
  axe_percent: number | null
  distance_level: number | null
  distance_percent: number | null
  shielding_level: number | null
  shielding_percent: number | null
  magic_level: number | null
  magic_percent: number | null
  recorded_at: string
}

export interface PlayerActivity {
  id: string
  character_name: string
  hidden: boolean
  caguetado_at: string | null
  caguetado_by_user_id: string | null
  total_payments: number
  last_payment_date: string | null
  paid_today: boolean
  total_check_ins: number
  last_check_in: string | null
  check_ins_today: number
  active_today: boolean
}

export interface UserEarnings {
  user_id: string
  character_name: string
  total_caguetados: number
  players_with_multa: number
  total_earnings_gp: number
}

export interface CaguetaDetail {
  player_id: string
  character_name: string
  caguetado_at: string
  caguetado_by_user_id: string | null
  caguetado_by_name: string | null
  has_paid: boolean
  payment_time: string | null
  deadline_passed: boolean
  paid_with_multa: boolean
  earnings_gp: number
}
