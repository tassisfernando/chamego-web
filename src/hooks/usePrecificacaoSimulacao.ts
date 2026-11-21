import { useEffect, useRef, useState } from 'react'
import { precificacoesApi } from '@/api/services'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { montarPayloadSimular, type LinhaPrecificacaoForm } from '@/lib/precificacaoPayload'
import type { SimulacaoPrecificacao, TipoPrecificacao } from '@/types/api'

export type EntradaSimulacaoPrecificacao = {
  tipo: TipoPrecificacao
  linhas: LinhaPrecificacaoForm[]
  margemPercentual: string
  precoVenda: string
  modoPreco: 'margem' | 'preco'
}

type Opcoes = {
  delayMs?: number
  habilitado?: boolean
  onSincronizarDerivado?: (simulacao: SimulacaoPrecificacao, modoPreco: 'margem' | 'preco') => void
}

export function usePrecificacaoSimulacao(entrada: EntradaSimulacaoPrecificacao, opcoes: Opcoes = {}) {
  const { delayMs = 400, habilitado = true, onSincronizarDerivado } = opcoes
  const debounced = useDebouncedValue(entrada, delayMs)
  const [simulacao, setSimulacao] = useState<SimulacaoPrecificacao | null>(null)
  const [simulando, setSimulando] = useState(false)
  const [erro, setErro] = useState(false)
  const sequencia = useRef(0)
  const sincronizarRef = useRef(onSincronizarDerivado)
  sincronizarRef.current = onSincronizarDerivado

  useEffect(() => {
    if (!habilitado) {
      setSimulacao(null)
      setSimulando(false)
      return
    }

    const payload = montarPayloadSimular(
      debounced.tipo,
      debounced.linhas,
      debounced.margemPercentual,
      debounced.precoVenda,
      debounced.modoPreco,
    )

    if (!payload) {
      setSimulacao(null)
      setSimulando(false)
      setErro(false)
      return
    }

    const idRequisicao = ++sequencia.current
    const controller = new AbortController()
    setSimulando(true)
    setErro(false)

    precificacoesApi
      .simular(payload, controller.signal)
      .then((resultado) => {
        if (idRequisicao !== sequencia.current) return
        setSimulacao(resultado)
        sincronizarRef.current?.(resultado, debounced.modoPreco)
      })
      .catch((e: unknown) => {
        if (idRequisicao !== sequencia.current) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setSimulacao(null)
        setErro(true)
      })
      .finally(() => {
        if (idRequisicao === sequencia.current) setSimulando(false)
      })

    return () => {
      controller.abort()
    }
  }, [debounced, habilitado])

  return { simulacao, simulando, erro }
}