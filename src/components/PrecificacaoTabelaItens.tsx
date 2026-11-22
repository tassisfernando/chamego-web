import { Trash2 } from 'lucide-react'
import { MaterialPrecificacaoCombobox } from '@/components/MaterialPrecificacaoCombobox'
import { Button, Field, Input, Select } from '@/components/ui'
import type { Insumo } from '@/types/api'
import { unidadeLabel } from '@/lib/labels'
import { custoFracionado } from '@/lib/precificacaoMaterialCalculos'
import { subtotalFormulario, type LinhaPrecificacaoForm } from '@/lib/precificacaoPayload'
import { cn, formatCurrency } from '@/lib/utils'
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

function resumoFracionado(linha: LinhaPrecificacaoForm): { texto: string; erro: boolean } | null {
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
  if (custo === null) {
    return {
      texto: 'Unidades incompatíveis — use a mesma família (massa, volume, comprimento ou unidade).',
      erro: true,
    }
  }
  return {
    texto: `Comprei ${linha.quantidadeEmbalagem} ${unidadeLabel[unidadeEmb]} por ${formatCurrency(Number(linha.valorEmbalagem) || 0)} e gasto ${linha.quantidade} ${unidadeLabel[unidadeUso]} por unidade → ${formatCurrency(custo)}`,
    erro: false,
  }
}

function SeletorModo({
  valor,
  desabilitado,
  onChange,
}: {
  valor: ModoCalculoMaterial
  desabilitado?: boolean
  onChange: (modo: ModoCalculoMaterial) => void
}) {
  if (desabilitado) {
    return <span className="rounded-lg bg-paper-deep/60 px-2.5 py-1 text-xs font-medium text-ink-soft">Vela (unitário)</span>
  }
  return (
    <div
      className="inline-flex rounded-xl border border-line bg-paper-deep/40 p-0.5"
      role="group"
      aria-label="Modo de cálculo"
    >
      {(
        [
          { id: 'UNITARIO' as const, label: 'Unitário' },
          { id: 'FRACIONADO' as const, label: 'Fracionado' },
        ] as const
      ).map((opcao) => (
        <button
          key={opcao.id}
          type="button"
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            valor === opcao.id ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
          )}
          onClick={() => onChange(opcao.id)}
        >
          {opcao.label}
        </button>
      ))}
    </div>
  )
}

function SelectUnidade({
  value,
  onChange,
  id,
}: {
  value: UnidadeMedida
  onChange: (u: UnidadeMedida) => void
  id?: string
}) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value as UnidadeMedida)} className="min-w-[5.5rem]">
      {Object.entries(unidadeLabel).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </Select>
  )
}

export function PrecificacaoTabelaItens({ linhas, onChange }: Props) {
  if (!linhas.length) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-paper-deep/30 px-4 py-8 text-center text-sm text-ink-soft">
        Adicione materiais ou selecione uma vela com ficha técnica.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {linhas.map((linha, index) => {
        const ehProduto = linha.tipo === 'PRODUTO'
        const sub = subtotalFormulario(linha)
        const resumoFrac =
          !ehProduto && linha.modoCalculo === 'FRACIONADO' ? resumoFracionado(linha) : null

        return (
          <li
            key={linha.key}
            className="rounded-2xl border border-line/90 bg-white/80 p-4 shadow-[0_4px_20px_rgba(31,42,36,0.04)]"
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                {ehProduto ? (
                  <Field label="Vela / produto">
                    <Input value={linha.descricao} readOnly className="bg-paper-deep/40" />
                  </Field>
                ) : (
                  <MaterialPrecificacaoCombobox
                    insumoId={linha.insumoId}
                    nomeExibicao={linha.descricao || linha.nomeMaterial || ''}
                    unidadeMedida={linha.unidadeMedida}
                    cadastrarNoCatalogo={!!linha.cadastrarNoCatalogo}
                    onVincularInsumo={(insumo: Insumo) =>
                      onChange(
                        alterarLinha(linhas, index, {
                          tipo: 'INSUMO',
                          insumoId: insumo.id,
                          nomeMaterial: undefined,
                          cadastrarNoCatalogo: false,
                          descricao: insumo.nome,
                          unidadeMedida: insumo.unidadeMedida,
                          unidadeEmbalagem: insumo.unidadeMedida,
                          custoUnitario: String(insumo.custoMedio),
                          valorEmbalagem: String(insumo.custoMedio),
                          quantidadeEmbalagem: '1',
                        }),
                      )
                    }
                    onMaterialAvulso={(nome) =>
                      onChange(
                        alterarLinha(linhas, index, {
                          tipo: 'INSUMO',
                          insumoId: undefined,
                          nomeMaterial: nome,
                          descricao: nome,
                          cadastrarNoCatalogo: false,
                        }),
                      )
                    }
                    onToggleCadastrar={(value) =>
                      onChange(alterarLinha(linhas, index, { cadastrarNoCatalogo: value }))
                    }
                  />
                )}
                <SeletorModo
                  valor={linha.modoCalculo}
                  desabilitado={ehProduto}
                  onChange={(modo) => onChange(alterarLinha(linhas, index, { modoCalculo: modo }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-ink-soft">Subtotal</p>
                  <p className="font-display text-lg font-semibold text-ink">{formatCurrency(sub)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Remover item"
                  onClick={() => onChange(linhas.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {ehProduto || linha.modoCalculo === 'UNITARIO' ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Quantidade">
                  <Input
                    type="number"
                    min={0}
                    step="0.0001"
                    value={linha.quantidade}
                    onChange={(e) => onChange(alterarLinha(linhas, index, { quantidade: e.target.value }))}
                  />
                </Field>
                <Field label="Custo unitário (R$)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={linha.custoUnitario}
                    onChange={(e) => onChange(alterarLinha(linhas, index, { custoUnitario: e.target.value }))}
                  />
                </Field>
                {!ehProduto ? (
                  <Field label="Unidade de medida">
                    <SelectUnidade
                      value={linha.unidadeMedida ?? 'UN'}
                      onChange={(u) => onChange(alterarLinha(linhas, index, { unidadeMedida: u }))}
                    />
                  </Field>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-line/70 bg-paper-deep/25 p-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    O que comprei (embalagem)
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Paguei (R$)">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={linha.valorEmbalagem}
                        onChange={(e) => onChange(alterarLinha(linhas, index, { valorEmbalagem: e.target.value }))}
                      />
                    </Field>
                    <Field label="Quantidade">
                      <Input
                        type="number"
                        min={0}
                        step="0.0001"
                        value={linha.quantidadeEmbalagem}
                        onChange={(e) =>
                          onChange(alterarLinha(linhas, index, { quantidadeEmbalagem: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Unidade">
                      <SelectUnidade
                        value={linha.unidadeEmbalagem ?? 'UN'}
                        onChange={(u) => onChange(alterarLinha(linhas, index, { unidadeEmbalagem: u }))}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-xl border border-line/70 bg-paper-deep/25 p-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    O que gasto por vela / kit
                  </h4>
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <Field label="Quantidade usada">
                      <Input
                        type="number"
                        min={0}
                        step="0.0001"
                        value={linha.quantidade}
                        onChange={(e) => onChange(alterarLinha(linhas, index, { quantidade: e.target.value }))}
                      />
                    </Field>
                    <Field label="Unidade">
                      <SelectUnidade
                        value={linha.unidadeMedida ?? 'UN'}
                        onChange={(u) => onChange(alterarLinha(linhas, index, { unidadeMedida: u }))}
                      />
                    </Field>
                  </div>
                </section>
              </div>
            )}

            {resumoFrac ? (
              <p
                className={cn(
                  'mt-3 rounded-lg px-3 py-2 text-sm',
                  resumoFrac.erro ? 'bg-amber-50 text-amber-900' : 'bg-leaf/10 text-ink',
                )}
              >
                {resumoFrac.texto}
              </p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}