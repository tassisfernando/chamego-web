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
export type StatusPedido = 'RASCUNHO' | 'ORCAMENTO' | 'CONFIRMADO' | 'CANCELADO'
export type NaturezaPedido = 'VENDA' | 'DOACAO' | 'PARCERIA' | 'CONTRIBUICAO'
export type TipoDespesa = 'INSUMO' | 'FERRAMENTA' | 'OPERACIONAL' | 'MARKETING'

export interface Pagina<T> {
  conteudo: T[]
  pagina: number
  tamanho: number
  totalElementos: number
  totalPaginas: number
}

export interface ParametrosPaginacao {
  page?: number
  size?: number
  sort?: string
  busca?: string
  status?: StatusPedido
}

export interface LoginPayload {
  usuario: string
  senha: string
}

export interface LoginResposta {
  token: string
  tipo: string
  expiraEm: string
  usuarioId: string
  login: string
}

export interface Cliente {
  id: string
  nome: string
  telefone?: string | null
  email?: string | null
  cidade?: string | null
  estado?: string | null
  dataCadastro: string
  dataNascimento?: string | null
  statusCupom: StatusCupom
  observacao?: string | null
  ativo: boolean
}

export interface CadastrarClientePayload {
  nome: string
  telefone?: string
  email?: string
  cidade?: string
  estado?: string
  dataNascimento?: string
  observacao?: string
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
  descontoPercentual?: number
  totalLiquido?: number
}

export interface Pedido {
  id: string
  clienteId: string
  dataPedido: string
  status: StatusPedido
  natureza: NaturezaPedido
  observacao?: string | null
  descontoPercentual?: number
  subtotalItens?: number
  valorTotal: number
  lucroBruto: number
  itens: ItemPedido[]
}

export interface ItemPedidoPayload {
  produtoId: string
  quantidade: number
  precoUnitario: number
  descontoPercentual?: number
}

export interface RegistrarPedidoPayload {
  clienteId: string
  dataPedido?: string
  natureza?: NaturezaPedido
  observacao?: string
  descontoPercentual?: number
  confirmarVenda?: boolean
  itens: ItemPedidoPayload[]
}

export type PedidoCriado = Pedido

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
  inicio?: string
  fim?: string
}

export interface AniversarianteResumo {
  id: string
  nome: string
  telefone?: string | null
  dataNascimento: string
  diasAteAniversario: number
  hoje: boolean
}

export interface PainelAniversariantes {
  proximos: AniversarianteResumo[]
  ultimos: AniversarianteResumo[]
}

export interface AtualizarProdutoPayload {
  nome: string
  descricao?: string
  categoria?: CategoriaProduto
  pesoGramas?: number
  precoVenda?: number
  custoPadrao?: number
  estoqueAtual?: number
}

export interface AtualizarInsumoPayload {
  nome: string
  categoria: CategoriaInsumo
  marca?: string
  unidadeMedida?: UnidadeMedida
  estoqueAtual?: number
  custoMedio?: number
}

export interface AtualizarPedidoPayload {
  clienteId: string
  dataPedido?: string
  natureza?: NaturezaPedido
  status?: StatusPedido
  observacao?: string
  descontoPercentual?: number
  itens: ItemPedidoPayload[]
}

export interface AtualizarProducaoPayload {
  produtoId: string
  dataProducao?: string
  quantidadeProduzida: number
  observacao?: string
}

export type AtualizarDespesaPayload = RegistrarDespesaPayload
