import type { SalvarPrecificacaoPayload, TipoItemPrecificacao, TipoPrecificacao, UnidadeMedida } from '@/types/api'

export type LinhaPrecificacaoForm = {
  tipo: TipoItemPrecificacao
  produtoId?: string
  insumoId?: string
  descricao: string
  quantidade: string
  unidadeMedida?: UnidadeMedida
  custoUnitario: string
}

function normalizarTipoLinha(linha: LinhaPrecificacaoForm): TipoItemPrecificacao {
  if (linha.tipo === 'INSUMO' && !linha.insumoId) return 'EXTRA'
  if (linha.tipo === 'PRODUTO' && !linha.produtoId) return 'EXTRA'
  return linha.tipo
}

export function mapearItensPayload(linhas: LinhaPrecificacaoForm[]) {
  return linhas
    .filter((l) => Number(l.quantidade) > 0)
    .map((l) => {
      const tipo = normalizarTipoLinha(l)
      const descricao = l.descricao.trim() || (tipo === 'EXTRA' ? 'Item' : undefined)
      return {
        tipo,
        produtoId: tipo === 'PRODUTO' ? l.produtoId : undefined,
        insumoId: tipo === 'INSUMO' ? l.insumoId : undefined,
        descricao,
        quantidade: Number(l.quantidade),
        unidadeMedida: l.unidadeMedida,
        custoUnitario: Number(l.custoUnitario) || 0,
      }
    })
}

export function montarPayloadSimular(
  tipo: TipoPrecificacao,
  linhas: LinhaPrecificacaoForm[],
  margemPercentual: string,
  precoVenda: string,
  modoPreco: 'margem' | 'preco',
): SalvarPrecificacaoPayload | null {
  const itens = mapearItensPayload(linhas)
  if (!itens.length) return null

  return {
    titulo: 'Simulação',
    tipo,
    itens,
    margemPercentual: modoPreco === 'margem' ? Number(margemPercentual) || 0 : undefined,
    precoVenda: modoPreco === 'preco' ? Number(precoVenda) || 0 : undefined,
  }
}

export function montarPayloadSalvar(
  titulo: string,
  tipo: TipoPrecificacao,
  produtoReferenciaId: string,
  linhas: LinhaPrecificacaoForm[],
  margemPercentual: string,
  precoVenda: string,
  observacao: string,
  modoPreco: 'margem' | 'preco',
): SalvarPrecificacaoPayload {
  const itens = mapearItensPayload(linhas)

  return {
    titulo: titulo.trim(),
    tipo,
    produtoReferenciaId: produtoReferenciaId || undefined,
    itens,
    margemPercentual: modoPreco === 'margem' ? Number(margemPercentual) || 0 : undefined,
    precoVenda: modoPreco === 'preco' ? Number(precoVenda) || 0 : undefined,
    observacao: observacao.trim() || undefined,
  }
}