/**
 * Utilitários de data para o sistema de treinos
 * O "dia de treino" começa às 10h da manhã
 */

/**
 * Retorna o timestamp de início do dia de treino atual
 * Se for antes das 10h, retorna 10h de ontem
 * Se for depois das 10h, retorna 10h de hoje
 */
export function getTrainingDayStart(): Date {
  const now = new Date()
  const currentHour = now.getHours()

  // Criar data às 10h de hoje
  const todayAt10 = new Date(now)
  todayAt10.setHours(10, 0, 0, 0)

  // Se ainda não passou das 10h, o "dia atual" começou às 10h de ontem
  if (currentHour < 10) {
    todayAt10.setDate(todayAt10.getDate() - 1)
  }

  return todayAt10
}

/**
 * Retorna o timestamp de início do dia de treino de ontem
 */
export function getYesterdayTrainingDayStart(): Date {
  const todayStart = getTrainingDayStart()
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  return yesterdayStart
}

/**
 * Verifica se uma data está no dia de treino atual
 */
export function isInCurrentTrainingDay(date: string | Date): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date
  const dayStart = getTrainingDayStart()
  return checkDate >= dayStart
}

/**
 * Formata o horário de reset do próximo dia de treino
 */
export function getNextResetTime(): string {
  const now = new Date()
  const currentHour = now.getHours()

  if (currentHour < 10) {
    return 'hoje às 10:00'
  } else {
    return 'amanhã às 10:00'
  }
}
