import { monthBounds, toIsoDate } from '@/lib/utils'

/** Chamego iniciou operações em dezembro/2025. */
export const ANO_MINIMO = 2025
export const MES_MINIMO_ANO_INICIAL = 12
export const DATA_INICIO_OPERACAO = '2025-12-01'

export type ModoPeriodo = 'mensal' | 'anual' | 'todo'

export type PeriodoFiltroEstado = {
  modo: ModoPeriodo
  ano: number
  mes: number
}

export function anosDisponiveis(anoAtual = new Date().getFullYear()) {
  const fim = Math.max(anoAtual, ANO_MINIMO)
  const anos: number[] = []
  for (let ano = fim; ano >= ANO_MINIMO; ano -= 1) {
    anos.push(ano)
  }
  return anos
}

export function mesesDisponiveis(ano: number) {
  const inicio = ano === ANO_MINIMO ? MES_MINIMO_ANO_INICIAL : 1
  return Array.from({ length: 12 - inicio + 1 }, (_, i) => inicio + i)
}

export function normalizarMes(ano: number, mes: number) {
  const permitidos = mesesDisponiveis(ano)
  if (permitidos.includes(mes)) return mes
  return permitidos[0]
}

export function estadoPeriodoPadrao(): PeriodoFiltroEstado {
  const agora = new Date()
  let ano = agora.getFullYear()
  let mes = agora.getMonth() + 1
  if (ano < ANO_MINIMO || (ano === ANO_MINIMO && mes < MES_MINIMO_ANO_INICIAL)) {
    ano = ANO_MINIMO
    mes = MES_MINIMO_ANO_INICIAL
  }
  return { modo: 'mensal', ano, mes: normalizarMes(ano, mes) }
}

export function resolverPeriodo({ modo, ano, mes }: PeriodoFiltroEstado): {
  inicio?: string
  fim?: string
  rotulo: string
} {
  if (modo === 'todo') {
    return {
      inicio: undefined,
      fim: undefined,
      rotulo: 'Todo o período',
    }
  }
  if (modo === 'anual') {
    const inicio = ano === ANO_MINIMO ? DATA_INICIO_OPERACAO : `${ano}-01-01`
    const fimAno = new Date(ano, 11, 31)
    const hoje = new Date()
    const fim = ano === hoje.getFullYear() && fimAno > hoje ? toIsoDate(hoje) : toIsoDate(fimAno)
    return { inicio, fim, rotulo: `Ano ${ano}` }
  }
  const bounds = monthBounds(ano, mes)
  return {
    inicio: bounds.inicio,
    fim: bounds.fim,
    rotulo: `${String(mes).padStart(2, '0')}/${ano}`,
  }
}

export function minDataOperacao() {
  return DATA_INICIO_OPERACAO
}
