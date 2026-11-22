import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { insumosApi } from '@/api/services'
import { Field, Input } from '@/components/ui'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { normalizarTexto } from '@/lib/normalizarTexto'
import { formatCurrency } from '@/lib/utils'
import { unidadeLabel } from '@/lib/labels'
import type { Insumo, UnidadeMedida } from '@/types/api'

type Props = {
  insumoId?: string
  nomeExibicao: string
  unidadeMedida?: UnidadeMedida
  cadastrarNoCatalogo: boolean
  onVincularInsumo: (insumo: Insumo) => void
  onMaterialAvulso: (nome: string) => void
  onToggleCadastrar: (value: boolean) => void
}

export function MaterialPrecificacaoCombobox({
  insumoId,
  nomeExibicao,
  unidadeMedida = 'UN',
  cadastrarNoCatalogo,
  onVincularInsumo,
  onMaterialAvulso,
  onToggleCadastrar,
}: Props) {
  const [termo, setTermo] = useState(nomeExibicao)
  const [aberto, setAberto] = useState(false)
  const busca = useDebouncedValue(termo, 250)

  const insumos = useQuery({
    queryKey: ['insumos-busca-precificacao', busca],
    queryFn: () => insumosApi.opcoes(busca || undefined),
    staleTime: 20_000,
  })

  const filtrados = useMemo(() => {
    const lista = insumos.data ?? []
    if (!busca.trim()) return lista.slice(0, 30)
    const n = normalizarTexto(busca)
    return lista.filter((i) => normalizarTexto(i.nome).includes(n)).slice(0, 30)
  }, [insumos.data, busca])

  const nomeExato = useMemo(() => {
    if (!termo.trim()) return false
    const n = normalizarTexto(termo)
    return (insumos.data ?? []).some((i) => normalizarTexto(i.nome) === n)
  }, [insumos.data, termo])

  const avulso = !insumoId && nomeExibicao.trim().length > 0

  return (
    <div className="space-y-2">
      <Field label="Material">
        <div className="relative">
          <Input
            placeholder="Buscar cera, essência, fita…"
            value={aberto ? termo : nomeExibicao}
            onFocus={() => {
              setAberto(true)
              setTermo(nomeExibicao)
            }}
            onChange={(e) => {
              setTermo(e.target.value)
              setAberto(true)
            }}
            onBlur={() => setTimeout(() => setAberto(false), 180)}
            autoComplete="off"
          />
          {aberto ? (
            <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-white shadow-lg">
              {filtrados.map((insumo) => (
                <li key={insumo.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-paper-deep/80"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onVincularInsumo(insumo)
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
              {termo.trim() && !nomeExato ? (
                <li className="border-t border-line">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-leaf hover:bg-paper-deep/80"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onMaterialAvulso(termo.trim())
                      setAberto(false)
                    }}
                  >
                    <Plus className="size-4 shrink-0" />
                    Usar &quot;{termo.trim()}&quot; como material avulso
                  </button>
                </li>
              ) : null}
              {!insumos.isLoading && filtrados.length === 0 && !termo.trim() ? (
                <li className="px-3 py-2 text-sm text-ink-soft">Digite para buscar materiais.</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </Field>

      {avulso ? (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line/80 bg-paper-deep/30 px-3 py-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={cadastrarNoCatalogo}
            onChange={(e) => onToggleCadastrar(e.target.checked)}
          />
          <span>
            <span className="font-medium text-ink">Salvar no catálogo de insumos</span>
            <span className="mt-0.5 block text-xs text-ink-soft">
              Ao salvar a precificação, &quot;{nomeExibicao}&quot; será cadastrado como insumo (categoria Outro, unidade{' '}
              {unidadeLabel[unidadeMedida]}).
            </span>
          </span>
        </label>
      ) : null}
    </div>
  )
}