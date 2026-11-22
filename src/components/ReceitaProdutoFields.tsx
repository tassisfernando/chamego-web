import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { insumosApi } from '@/api/services'
import { InsumoCombobox } from '@/components/InsumoCombobox'
import { Button, Input, Select, TableShell, Td, Th } from '@/components/ui'
import { unidadeLabel } from '@/lib/labels'
import type { Insumo, ItemReceita, UnidadeMedida } from '@/types/api'

export type LinhaReceitaForm = {
  key: string
  insumoId: string
  quantidade: string
  unidadeMedida: UnidadeMedida
}

type Props = {
  linhas: LinhaReceitaForm[]
  onChange: (linhas: LinhaReceitaForm[]) => void
}

function novaLinha(unidade: UnidadeMedida = 'G'): LinhaReceitaForm {
  return { key: crypto.randomUUID(), insumoId: '', quantidade: '', unidadeMedida: unidade }
}

export function linhasReceitaParaPayload(linhas: LinhaReceitaForm[]): ItemReceita[] {
  return linhas
    .filter((l) => l.insumoId && Number(l.quantidade) > 0)
    .map((l) => ({
      insumoId: l.insumoId,
      quantidade: Number(l.quantidade),
      unidadeMedida: l.unidadeMedida,
    }))
}

export function receitaParaLinhas(receita: ItemReceita[]): LinhaReceitaForm[] {
  if (!receita.length) return []
  return receita.map((item) => ({
    key: crypto.randomUUID(),
    insumoId: item.insumoId,
    quantidade: String(item.quantidade),
    unidadeMedida: item.unidadeMedida,
  }))
}

export function ReceitaProdutoFields({ linhas, onChange }: Props) {
  const insumos = useQuery({ queryKey: ['insumos-opcoes'], queryFn: () => insumosApi.opcoes() })

  function aoSelecionarInsumo(index: number, insumo: Insumo) {
    onChange(
      linhas.map((linha, i) =>
        i === index
          ? {
              ...linha,
              insumoId: insumo.id,
              unidadeMedida: insumo.unidadeMedida,
            }
          : linha,
      ),
    )
  }

  function adicionarLinha() {
    onChange([...linhas, novaLinha()])
  }

  return (
    <div className="mt-2 border-t border-line pt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Ficha técnica (receita)</h3>
          <p className="text-xs text-ink-soft">
            Materiais por uma unidade do produto — usada na precificação e na produção.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={adicionarLinha}>
          <Plus className="size-4" />
          Material
        </Button>
      </div>

      {linhas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-paper-deep/30 px-3 py-4 text-center text-sm text-ink-soft">
          Nenhum material na receita. Adicione insumos para calcular custo e produzir.
        </p>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Insumo</Th>
              <Th>Quantidade</Th>
              <Th>Unidade</Th>
              <Th aria-label="Ações"> </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/70">
            {linhas.map((linha, index) => (
              <tr key={linha.key}>
                <Td>
                  <InsumoCombobox value={linha.insumoId} onSelect={(insumo) => aoSelecionarInsumo(index, insumo)} />
                </Td>
                <Td>
                  <Input
                    type="number"
                    min={0}
                    step="0.001"
                    required
                    value={linha.quantidade}
                    onChange={(e) =>
                      onChange(
                        linhas.map((l, i) => (i === index ? { ...l, quantidade: e.target.value } : l)),
                      )
                    }
                  />
                </Td>
                <Td>
                  <Select
                    value={linha.unidadeMedida}
                    onChange={(e) =>
                      onChange(
                        linhas.map((l, i) =>
                          i === index ? { ...l, unidadeMedida: e.target.value as UnidadeMedida } : l,
                        ),
                      )
                    }
                  >
                    {Object.entries(unidadeLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onChange(linhas.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {insumos.isError ? (
        <p className="mt-2 text-xs text-amber-800">Não foi possível carregar a lista de insumos.</p>
      ) : null}
    </div>
  )
}