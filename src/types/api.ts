export type StatusCupom = 'NAO_DEFINIDO' | 'PENDENTE_ENVIO' | 'ENVIADO' | 'NAO_APLICA'
export type CategoriaProduto = 'VELA' | 'KIT' | 'COMPLEMENTO'
export type CategoriaInsumo =
  | 'ESSENCIA'
  | 'CERA'
  | 'RECIPIENTE'
  | 'PAVIO'
  | 'ADESIVO'
  | 'EMBALAGEM'
  | 'SPA'
  | 'CORANTE'
  | 'OUTRO'
export type UnidadeMedida = 'UN' | 'ML' | 'G' | 'KG' | 'MT'
export type StatusPedido = 'RASCUNHO' | 'CONFIRMADO' | 'CANCELADO'
export type NaturezaPedido = 'VENDA' | 'DOACAO' | 'PARCERIA' | 'CONTRIBUICAO'
export type TipoDespesa = 'INSUMO' | 'FERRAMENTA' | 'OPERACIONAL' | 'MARKETING'

export interface Cliente {
  id: string
  nome: string
  telefone?: string | null
  cidade?: string | null
  estado?: string | null
  dataCadastro: string
  dataNascimento?: string | null
  statusCupom: StatusCupom
}

export interface CadastrarClientePayload {
  nome: string
  telefone?: string
  cidade?: string
  estado?: string
  dataNascimento?: string
}

export interface ItemReceita {
  insumoId: string
  quantidade: number
  unidadeMedida: UnidadeMedida
}

export interface Produto {
  id: string
  nome: string
  descricao?: string | null
  categoria: CategoriaProduto
  pesoGramas?: number | null
  precoVenda: number
  custoPadrao: number
  estoqueAtual: number
  ativo: boolean
  receita: ItemReceita[]
}

export interface CadastrarProdutoPayload {
  nome: string
  categoria?: CategoriaProduto
  pesoGramas?: number
  precoVenda?: number
  custoPadrao?: number
  receita?: ItemReceita[]
}

export interface Insumo {
  id: string
  nome: string
  categoria: CategoriaInsumo
  marca?: string | null
  unidadeMedida: UnidadeMedida
  estoqueAtual: number
  custoMedio: number
  ativo: boolean
}

export interface CadastrarInsumoPayload {
  nome: string
  categoria: CategoriaInsumo
  marca?: string
  unidadeMedida: UnidadeMedida
}

export interface Ferramenta {
  id: string
  nome: string
  quantidade: number
  unidadeMedida: UnidadeMedida
  valorAquisicao: number
  dataCompra?: string | null
  observacao?: string | null
  ativo: boolean
}

export interface CadastrarFerramentaPayload {
  nome: string
  quantidade?: number
  unidadeMedida?: UnidadeMedida
  valorAquisicao?: number
  dataCompra?: string
  observacao?: string
}

export interface ItemPedido {
  produtoId: string
  quantidade: number
  precoUnitario: number
  custoUnitario?: number
}

export interface Pedido {
  id: string
  clienteId: string
  dataPedido: string
  status: StatusPedido
  natureza: NaturezaPedido
  observacao?: string | null
  valorTotal: number
  lucroBruto: number
  itens: ItemPedido[]
}

export interface RegistrarPedidoPayload {
  clienteId: string
  dataPedido?: string
  natureza?: NaturezaPedido
  observacao?: string
  itens: Array<{
    produtoId: string
    quantidade: number
    precoUnitario: number
  }>
}

export interface PedidoCriado {
  id: string
  status: StatusPedido
  valorTotal: number
  lucroBruto: number
}

export interface Despesa {
  id: string
  descricao: string
  dataDespesa: string
  valor: number
  quantidade?: number | null
  unidadeMedida?: UnidadeMedida | null
  tipo: TipoDespesa
  insumoId?: string | null
  ferramentaId?: string | null
  observacao?: string | null
}

export interface RegistrarDespesaPayload {
  descricao: string
  dataDespesa?: string
  valor: number
  quantidade?: number
  unidadeMedida?: UnidadeMedida
  tipo: TipoDespesa
  insumoId?: string
  ferramentaId?: string
  observacao?: string
}

export interface Producao {
  id: string
  produtoId: string
  dataProducao: string
  quantidadeProduzida: number
  custoUnitario: number
  custoTotal: number
  observacao?: string | null
}

export interface RegistrarProducaoPayload {
  produtoId: string
  dataProducao?: string
  quantidadeProduzida: number
  observacao?: string
}

export interface ResultadoFinanceiro {
  inicio: string
  fim: string
  receitaVendas: number
  custoMercadoriaVendida: number
  lucroBruto: number
  totalDespesas: number
  resultadoLiquido: number
}

export interface Periodo {
  inicio: string
  fim: string
}
