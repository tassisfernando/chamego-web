import type {
  CategoriaInsumo,
  CategoriaProduto,
  NaturezaPedido,
  StatusCupom,
  StatusPedido,
  TipoDespesa,
  UnidadeMedida,
} from '@/types/api'

export const categoriaProdutoLabel: Record<CategoriaProduto, string> = {
  VELA: 'Vela',
  KIT: 'Kit',
  COMPLEMENTO: 'Complemento',
}

export const categoriaInsumoLabel: Record<CategoriaInsumo, string> = {
  ESSENCIA: 'Essência',
  CERA: 'Cera',
  RECIPIENTE: 'Recipiente',
  PAVIO: 'Pavio',
  ADESIVO: 'Adesivo',
  EMBALAGEM: 'Embalagem',
  SPA: 'Spa',
  CORANTE: 'Corante',
  OUTRO: 'Outro',
}

export const unidadeLabel: Record<UnidadeMedida, string> = {
  UN: 'Unidade',
  ML: 'ml',
  L: 'L',
  G: 'g',
  KG: 'kg',
  MT: 'm',
  CM: 'cm',
}

export const naturezaPedidoLabel: Record<NaturezaPedido, string> = {
  VENDA: 'Venda',
  DOACAO: 'Doação',
  PARCERIA: 'Parceria',
  CONTRIBUICAO: 'Contribuição',
}

export const statusPedidoLabel: Record<StatusPedido, string> = {
  RASCUNHO: 'Rascunho',
  ORCAMENTO: 'Orçamento',
  CONFIRMADO: 'Venda confirmada',
  CANCELADO: 'Cancelado',
}

export const tipoDespesaLabel: Record<TipoDespesa, string> = {
  INSUMO: 'Compra de insumo',
  FERRAMENTA: 'Ferramenta',
  OPERACIONAL: 'Operacional',
  MARKETING: 'Marketing',
}

export const statusCupomLabel: Record<StatusCupom, string> = {
  NAO_DEFINIDO: 'Não definido',
  PENDENTE_ENVIO: 'Pendente de envio',
  ENVIADO: 'Enviado',
  NAO_APLICA: 'Não se aplica',
}

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]
