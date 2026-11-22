import { Trash2 } from 'lucide-react'
import { Button, Input, Select, TableShell, Td, Th } from '@/components/ui'
import { unidadeLabel } from '@/lib/labels'
import { custoFracionado } from '@/lib/precificacaoMaterialCalculos'
import { subtotalFormulario, type LinhaPrecificacaoForm } from '@/lib/precificacaoPayload'
import { formatCurrency } from '@/lib/utils'
import type { ModoCalculoMaterial, UnidadeMedida } from '@/types/api'

type Props = {
  linhas: (LinhaPrecificacaoForm & { key: string })[]
  onChange: (linhas: (LinhaPrecificacaoForm & { key: string })[]) => void
}

function alterarLinha(
  linhas: (LinhaPrecificacaoForm & { key: string })[],
  index: number,
  patch: Partial<LinhaPrecificacaoForm>,
) {
  return linhas.map((l, i) => (i === index ? { ...l, ...patch } : l))
}

function resumoFracionado(linha: LinhaPrecificacaoForm): string | null {
  const unidadeUso = linha.unidadeMedida
  const unidadeEmb = linha.unidadeEmbalagem
  if (!unidadeUso || !unidadeEmb) return null
  const custo = custoFracionado(
    Number(linha.valorEmbalagem) || 0,
    Number(linha.quantidadeEmbalagem) || 0,
    unidadeEmb,
    Number(linha.quantidade) || 0,
    unidadeUso,
  )
  if (custo === null) return 'Unidades incompatíveis — use a mesma família (massa, volume, comprimento ou un.)'
  return `Comprei ${linha.quantidadeEmbalagem} ${unidadeLabel[unidadeEmb]} por ${formatCurrency(Number(linha.valorEmbalagem) || 0)} e gasto ${linha.quantidade} ${unidadeLabel[unidadeUso]} → Custo: ${formatCurrency(custo)}`
}

export function PrecificacaoTabelaItens({ linhas, onChange }: Props) {
  const opcoesUnidade = Object.entries(unidadeLabel).map(([value, label]) => (
    <option key={value} value={value}>
      {label}
    </option>
  ))

  function aoMudarModo(index: number, modo: ModoCalculoMaterial) {
    onChange(alterarLinha(linhas, index, { modoCalculo: modo }))
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <Th>Item</Th>
          <Th>Modo</Th>
          <Th>Detalhes</Th>
          <Th>Subtotal</Th>
          <Th aria-label="Ações"> </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line bg-white/70">
        {linhas.map((linha, index) => {
          const ehProduto = linha.tipo === 'PRODUTO'
          const sub = subtotalFormulario(linha)
          const resumoFrac = !ehProduto && linha.modoCalculo === 'FRACIONADO' ? resumoFracionado(linha) : null

          return (
            <tr key={linha.key}>
              <Td className="min-w-[10rem] align-top">
                <Input
                  value={linha.descricao}
                  onChange={(e) => onChange(alterarLinha(linhas, index, { descricao: e.target.value }))}
                  placeholder="Descrição"
                  disabled={linha.tipo === 'INSUMO' && !!linha.insumoId}
                />
              </Td>
              <Td className="align-top">
                {ehProduto ? (
                  <span className="text-sm text-ink-soft">Unitário (vela)</span>
                ) : (
                  <Select
                    value={linha.modoCalculo}
                    onChange={(e) => aoMudarModo(index, e.target.value as ModoCalculoMaterial)}
                  >
                    <option value="UNITARIO">Unitário</option>
                    <option value="FRACIONADO">Fracionado / proporcional</option>
                  </Select>
                )}
              </Td>
              <Td className="align-top">
                {ehProduto || linha.modoCalculo === 'UNITARIO' ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div>
                      <span className="mb-1 block text-xs text-ink-soft">Quantidade</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.0001"
                        value={linha.quantidade}
                        onChange={(e) => onChange(alterarLinha(linhas, index, { quantidade: e.target.value }))}
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-ink-soft">Custo unitário (R$)</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={linha.custoUnitario}
                        onChange={(e) => onChange(alterarLinha(linhas, index, { custoUnitario: e.target.value }))}
                      />
                    </div>
                    {!ehProduto ? (
                      <div>
                        <span className="mb-1 block text-xs text-ink-soft">Unidade</span>
                        <Select
                          value={linha.unidadeMedida ?? 'UN'}
                          onChange={(e) =>
                            onChange(
                              alterarLinha(linhas, index, { unidadeMedida: e.target.value as UnidadeMedida }),
                            )
                          }
                        >
                          {opcoesUnidade}
                        </Select>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="mb-1 block text-xs text-ink-soft">Paguei na embalagem (R$)</span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={linha.valorEmbalagem}
                          onChange={(e) => onChange(alterarLinha(linhas, index, { valorEmbalagem: e.target.value }))}
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-ink-soft">Qtd. total comprada</span>
                        <Input
                          type="number"
                          min={0}
                          step="0.0001"
                          value={linha.quantidadeEmbalagem}
                          onChange={(e) =>
                            onChange(alterarLinha(linhas, index, { quantidadeEmbalagem: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-ink-soft">Unidade da embalagem</span>
                        <Select
                          value={linha.unidadeEmbalagem ?? 'UN'}
                          onChange={(e) =>
                            onChange(
                              alterarLinha(linhas, index, { unidadeEmbalagem: e.target.value as UnidadeMedida }),
                            )
                          }
                        >
                          {opcoesUnidade}
                        </Select>
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-ink-soft">Gasto por unidade / kit</span>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            min={0}
                            step="0.0001"
                            value={linha.quantidade}
                            onChange={(e) => onChange(alterarLinha(linhas, index, { quantidade: e.target.value }))}
                          />
                          <Select
                            className="max-w-[5.5rem]"
                            value={linha.unidadeMedida ?? 'UN'}
                            onChange={(e) =>
                              onChange(
                                alterarLinha(linhas, index, { unidadeMedida: e.target.value as UnidadeMedida }),
                              )
                            }
                          >
                            {opcoesUnidade}
                          </Select>
                        </div>
                      </div>
                    </div>
                    {resumoFrac ? (
                      <p
                        className={`text-xs ${resumoFrac.includes('incompatíveis') ? 'text-amber-800' : 'text-ink-soft'}`}
                      >
                        {resumoFrac}
                      </p>
                    ) : null}
                  </div>
                )}
              </Td>
              <Td className="align-top font-medium">{formatCurrency(sub)}</Td>
              <Td className="align-top">
                <Button type="button" variant="ghost" onClick={() => onChange(linhas.filter((_, i) => i !== index))}>
                  <Trash2 className="size-4" />
                </Button>
              </Td>
            </tr>
          )
        })}
      </tbody>
    </TableShell>
  )
}