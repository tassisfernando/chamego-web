import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { produtosApi } from '@/api/services'
import { Input } from '@/components/ui'
import { normalizarTexto } from '@/lib/normalizarTexto'
import { formatCurrency } from '@/lib/utils'
import type { Produto } from '@/types/api'

type Props = {
  value: string
  onSelect: (produto: Produto) => void
  disabled?: boolean
}

export function ProductCombobox({ value, onSelect, disabled }: Props) {
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)

  const produtos = useQuery({
    queryKey: ['produtos-busca', termo],
    queryFn: () => produtosApi.opcoes(termo || undefined),
    staleTime: 30_000,
  })

  const selecionado = useMemo(
    () => (produtos.data ?? []).find((p) => p.id === value),
    [produtos.data, value],
  )

  const filtrados = useMemo(() => {
    const lista = produtos.data ?? []
    if (!termo.trim()) return lista
    const n = normalizarTexto(termo)
    return lista.filter((p) => normalizarTexto(p.nome).includes(n))
  }, [produtos.data, termo])

  return (
    <div className="relative">
      <Input
        disabled={disabled}
        placeholder="Buscar vela por nome…"
        value={aberto ? termo : selecionado?.nome ?? ''}
        onFocus={() => {
          setAberto(true)
          setTermo(selecionado?.nome ?? '')
        }}
        onChange={(e) => {
          setTermo(e.target.value)
          setAberto(true)
        }}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        autoComplete="off"
      />
      {aberto && filtrados.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-line bg-white shadow-lg">
          {filtrados.map((produto) => (
            <li key={produto.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-paper-deep/80"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(produto)
                  setTermo(produto.nome)
                  setAberto(false)
                }}
              >
                <span className="font-medium">{produto.nome}</span>
                <span className="ml-2 text-ink-soft">
                  {formatCurrency(produto.precoVenda)} · estoque {produto.estoqueAtual}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}