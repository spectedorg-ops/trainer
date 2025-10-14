import { supabase } from './supabase'

export interface User {
  id: string
  character_name: string
  vocation: 'MS' | 'ED' | 'EK' | 'RP'
  is_admin: boolean
  created_at: string
}

// Hash simples de senha (em produção, use bcrypt)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function login(characterName: string, password: string): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(password)

    const { data, error } = await supabase
      .from('users')
      .select('id, character_name, vocation, is_admin, created_at')
      .eq('character_name', characterName)
      .eq('password_hash', passwordHash)
      .single()

    if (error) {
      console.error('Login error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Login exception:', error)
    return null
  }
}

export async function register(characterName: string, password: string, vocation: 'MS' | 'ED' | 'EK' | 'RP'): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar senha
    if (password.length < 4) {
      return { success: false, error: 'Senha deve ter no mínimo 4 caracteres' }
    }

    const passwordHash = await hashPassword(password)

    // Verificar se é White Widow para tornar admin
    const isAdmin = characterName === 'White Widow'

    // Criar usuário
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        character_name: characterName,
        password_hash: passwordHash,
        vocation: vocation,
        is_admin: isAdmin
      }])

    if (userError) {
      if (userError.code === '23505') {
        return { success: false, error: 'Este personagem já está registrado' }
      }
      return { success: false, error: userError.message }
    }

    // Criar player automaticamente com o mesmo nome (se ainda não existir)
    const { error: playerError } = await supabase
      .from('players')
      .insert([{
        character_name: characterName
      }])

    if (playerError) {
      // Se o erro for que o player já existe (código 23505), tudo bem - apenas ignore
      if (playerError.code === '23505') {
        console.log('Player já existe no sistema, continuando...')
      } else {
        // Outros erros são logados mas não bloqueiam o registro
        console.error('Erro ao criar player:', playerError)
      }
      // Não retorna erro pois o user foi criado com sucesso
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Gerenciamento de sessão local
const SESSION_KEY = 'tibia_treinos_user'

export function saveSession(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  }
}

export function getSession(): User | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(SESSION_KEY)
    return data ? JSON.parse(data) : null
  }
  return null
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}
