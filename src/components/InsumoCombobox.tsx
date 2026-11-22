import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { insumosApi } from '@/api/services'
import { Input } from '@/components/ui'
import { normalizarTexto } from '@/lib/normalizarTexto'
import { formatCurrency } from '@/lib/utils'
import type { Insumo } from '@/types/api'

type Props = {
  value: string
  onSelect: (insumo: Insumo) => void
}

export function InsumoCombobox({ value, onSelect }: Props) {
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)
  const insumos = useQuery({ queryKey: ['insumos-opcoes'], queryFn: () => insumosApi.opcoes() })

  const selecionado = useMemo(
    () => (insumos.data ?? []).find((i) => i.id === value),
    [insumos.data, value],
  )

  const filtrados = useMemo(() => {
    const lista = insumos.data ?? []
    if (!termo.trim()) return lista.slice(0, 40)
    const n = normalizarTexto(termo)
    return lista.filter((i) => normalizarTexto(i.nome).includes(n)).slice(0, 40)
  }, [insumos.data, termo])

  return (
    <div className="relative">
      <Input
        placeholder="Buscar material…"
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
          {filtrados.map((insumo) => (
            <li key={insumo.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-paper-deep/80"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(insumo)
                  setTermo(insumo.nome)
                  setAberto(false)
                }}
              >
                <span className="font-medium">{insumo.nome}</span>
                <span className="ml-2 text-ink-soft">
                  {formatCurrency(insumo.custoMedio)} / {insumo.unidadeMedida.toLowerCase()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}