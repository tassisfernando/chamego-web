import { subtotalLinhaMaterial } from '@/lib/precificacaoMaterialCalculos'
import type {
  ModoCalculoMaterial,
  SalvarPrecificacaoPayload,
  TipoItemPrecificacao,
  TipoPrecificacao,
  UnidadeMedida,
} from '@/types/api'

export type LinhaPrecificacaoForm = {
  tipo: TipoItemPrecificacao
  produtoId?: string
  insumoId?: string
  nomeMaterial?: string
  cadastrarNoCatalogo?: boolean
  descricao: string
  modoCalculo: ModoCalculoMaterial
  quantidade: string
  unidadeMedida?: UnidadeMedida
  custoUnitario: string
  valorEmbalagem: string
  quantidadeEmbalagem: string
  unidadeEmbalagem?: UnidadeMedida
}

export function linhaPrecificacaoVazia(tipo: TipoItemPrecificacao = 'INSUMO'): Omit<LinhaPrecificacaoForm, never> {
  return {
    tipo,
    descricao: '',
    modoCalculo: 'UNITARIO',
    quantidade: '1',
    unidadeMedida: 'UN',
    custoUnitario: '',
    valorEmbalagem: '',
    quantidadeEmbalagem: '1',
    unidadeEmbalagem: 'UN',
  }
}

function normalizarTipoLinha(linha: LinhaPrecificacaoForm): TipoItemPrecificacao {
  if (linha.tipo === 'PRODUTO' && !linha.produtoId) return 'EXTRA'
  if (linha.tipo === 'EXTRA') return 'EXTRA'
  return linha.tipo
}

export function subtotalFormulario(linha: LinhaPrecificacaoForm): number {
  const tipo = normalizarTipoLinha(linha)
  if (Number(linha.quantidade) <= 0) return 0
  return subtotalLinhaMaterial({
    tipo,
    modoCalculo: linha.modoCalculo,
    quantidade: Number(linha.quantidade) || 0,
    custoUnitario: Number(linha.custoUnitario) || 0,
    valorEmbalagem: Number(linha.valorEmbalagem) || 0,
    quantidadeEmbalagem: Number(linha.quantidadeEmbalagem) || 0,
    unidadeEmbalagem: linha.unidadeEmbalagem,
    unidadeMedida: linha.unidadeMedida,
  })
}

export function totalCustoFormulario(linhas: LinhaPrecificacaoForm[]) {
  return linhas.reduce((acc, linha) => acc + subtotalFormulario(linha), 0)
}

export function mapearItensPayload(linhas: LinhaPrecificacaoForm[]) {
  return linhas
    .filter((l) => Number(l.quantidade) > 0)
    .map((l) => {
      const tipo = normalizarTipoLinha(l)
      const nomeAvulso = !l.insumoId
        ? (l.nomeMaterial?.trim() || l.descricao.trim() || undefined)
        : undefined
      const descricao =
        l.descricao.trim() || nomeAvulso || (tipo === 'EXTRA' ? 'Item' : undefined)
      return {
        tipo,
        produtoId: tipo === 'PRODUTO' ? l.produtoId : undefined,
        insumoId: tipo === 'INSUMO' && l.insumoId ? l.insumoId : undefined,
        nomeMaterial: tipo === 'INSUMO' && !l.insumoId ? nomeAvulso : undefined,
        descricao,
        modoCalculo: tipo === 'PRODUTO' ? 'UNITARIO' : l.modoCalculo,
        quantidade: Number(l.quantidade),
        unidadeMedida: l.unidadeMedida,
        custoUnitario: l.modoCalculo === 'UNITARIO' ? Number(l.custoUnitario) || 0 : 0,
        valorEmbalagem: l.modoCalculo === 'FRACIONADO' ? Number(l.valorEmbalagem) || 0 : undefined,
        quantidadeEmbalagem:
          l.modoCalculo === 'FRACIONADO' ? Number(l.quantidadeEmbalagem) || 0 : undefined,
        unidadeEmbalagem: l.modoCalculo === 'FRACIONADO' ? l.unidadeEmbalagem : undefined,
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

export function itemApiParaLinha(item: {
  tipo: TipoItemPrecificacao
  produtoId?: string | null
  insumoId?: string | null
  nomeMaterial?: string | null
  descricao?: string | null
  modoCalculo?: ModoCalculoMaterial | null
  quantidade: number
  unidadeMedida?: UnidadeMedida | null
  custoUnitario: number
  valorEmbalagem?: number | null
  quantidadeEmbalagem?: number | null
  unidadeEmbalagem?: UnidadeMedida | null
}): LinhaPrecificacaoForm {
  return {
    tipo: item.tipo,
    produtoId: item.produtoId ?? undefined,
    insumoId: item.insumoId ?? undefined,
    nomeMaterial: item.nomeMaterial ?? item.descricao ?? undefined,
    cadastrarNoCatalogo: false,
    descricao: item.descricao ?? item.nomeMaterial ?? '',
    modoCalculo: item.modoCalculo ?? 'UNITARIO',
    quantidade: String(item.quantidade),
    unidadeMedida: item.unidadeMedida ?? 'UN',
    custoUnitario: String(item.custoUnitario),
    valorEmbalagem: item.valorEmbalagem != null ? String(item.valorEmbalagem) : '',
    quantidadeEmbalagem: item.quantidadeEmbalagem != null ? String(item.quantidadeEmbalagem) : '1',
    unidadeEmbalagem: item.unidadeEmbalagem ?? item.unidadeMedida ?? 'UN',
  }
}