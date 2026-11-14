import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export function formatDateTimePt(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function toIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function monthBounds(year: number, month: number) {
  const inicio = new Date(year, month - 1, 1)
  const fim = new Date(year, month, 0)
  return { inicio: toIsoDate(inicio), fim: toIsoDate(fim) }
}

export function todayIso() {
  return toIsoDate(new Date())
}

export function parseApiError(error: unknown, fallback = 'Não foi possível concluir a ação.') {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { mensagem?: string } } }).response
    if (response?.data?.mensagem) return response.data.mensagem
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
