import type { ModoCalculoMaterial, UnidadeMedida } from '@/types/api'

type FamiliaUnidade = 'MASSA' | 'VOLUME' | 'COMPRIMENTO' | 'UNIDADE'

function familia(unidade: UnidadeMedida): FamiliaUnidade {
  switch (unidade) {
    case 'G':
    case 'KG':
      return 'MASSA'
    case 'ML':
    case 'L':
      return 'VOLUME'
    case 'MT':
    case 'CM':
      return 'COMPRIMENTO'
    default:
      return 'UNIDADE'
  }
}

export function normalizarQuantidade(unidade: UnidadeMedida, quantidade: number): number {
  switch (unidade) {
    case 'KG':
      return quantidade * 1000
    case 'L':
      return quantidade * 1000
    case 'MT':
      return quantidade * 100
    default:
      return quantidade
  }
}

export function custoFracionado(
  valorEmbalagem: number,
  quantidadeEmbalagem: number,
  unidadeEmbalagem: UnidadeMedida,
  quantidadeUsada: number,
  unidadeUsada: UnidadeMedida,
): number | null {
  if (valorEmbalagem <= 0 || quantidadeEmbalagem <= 0 || quantidadeUsada <= 0) return 0
  const famEmb = familia(unidadeEmbalagem)
  const famUso = familia(unidadeUsada)
  if (famEmb !== famUso) return null
  if (famEmb === 'UNIDADE' && unidadeEmbalagem !== unidadeUsada) return null

  const emb = normalizarQuantidade(unidadeEmbalagem, quantidadeEmbalagem)
  const uso = normalizarQuantidade(unidadeUsada, quantidadeUsada)
  return Math.round((valorEmbalagem / emb) * uso * 100) / 100
}

export function subtotalLinhaMaterial(input: {
  tipo: 'INSUMO' | 'PRODUTO' | 'EXTRA'
  modoCalculo: ModoCalculoMaterial
  quantidade: number
  custoUnitario: number
  valorEmbalagem: number
  quantidadeEmbalagem: number
  unidadeEmbalagem?: UnidadeMedida
  unidadeMedida?: UnidadeMedida
}): number {
  if (input.tipo === 'PRODUTO') {
    return Math.round(input.quantidade * input.custoUnitario * 100) / 100
  }
  if (input.modoCalculo === 'FRACIONADO' && input.unidadeMedida && input.unidadeEmbalagem) {
    const fracionado = custoFracionado(
      input.valorEmbalagem,
      input.quantidadeEmbalagem,
      input.unidadeEmbalagem,
      input.quantidade,
      input.unidadeMedida,
    )
    return fracionado ?? 0
  }
  return Math.round(input.quantidade * input.custoUnitario * 100) / 100
}