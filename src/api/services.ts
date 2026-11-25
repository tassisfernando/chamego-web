import { api } from './client'
import type {
  AtualizarDespesaPayload,
  AtualizarInsumoPayload,
  AtualizarPedidoPayload,
  AtualizarProducaoPayload,
  AtualizarProdutoPayload,
  CadastrarClientePayload,
  CadastrarFerramentaPayload,
  CadastrarInsumoPayload,
  CadastrarProdutoPayload,
  Cliente,
  Despesa,
  Ferramenta,
  Insumo,
  LoginPayload,
  LoginResposta,
  Pagina,
  PainelAniversariantes,
  PainelEntregas,
  ParametrosPaginacao,
  ItemPrecificacao,
  Pedido,
  PedidoCriado,
  Periodo,
  Precificacao,
  Producao,
  Produto,
  SalvarPrecificacaoPayload,
  SimulacaoPrecificacao,
  RegistrarDespesaPayload,
  RegistrarPedidoPayload,
  RegistrarProducaoPayload,
  ResultadoFinanceiro,
} from '@/types/api'

function paramsPaginacao(p?: ParametrosPaginacao) {
  return {
    page: p?.page ?? 0,
    size: p?.size ?? 20,
    ...(p?.sort ? { sort: p.sort } : {}),
    ...(p?.busca?.trim() ? { busca: p.busca.trim() } : {}),
    ...(p?.status ? { status: p.status } : {}),
  }
}

function paramsPeriodo(periodo?: Periodo) {
  return {
    ...(periodo?.inicio ? { inicio: periodo.inicio } : {}),
    ...(periodo?.fim ? { fim: periodo.fim } : {}),
  }
}

export const authApi = {
  login: async (payload: LoginPayload) =>
    (await api.post<LoginResposta>('/api/auth/login', payload)).data,
}

export const clientesApi = {
  listar: async (p?: ParametrosPaginacao) =>
    (await api.get<Pagina<Cliente>>('/api/clientes', { params: paramsPaginacao(p) })).data,
  opcoes: async (search?: string) =>
    (
      await api.get<Cliente[]>('/api/clientes/opcoes', {
        params: search?.trim() ? { search: search.trim() } : undefined,
      })
    ).data,
  aniversariantes: async () => (await api.get<Cliente[]>('/api/clientes/aniversariantes')).data,
  painelAniversariantes: async () =>
    (await api.get<PainelAniversariantes>('/api/clientes/aniversariantes/painel')).data,
  cadastrar: async (payload: CadastrarClientePayload) =>
    (await api.post<Cliente>('/api/clientes', payload)).data,
  atualizar: async (id: string, payload: CadastrarClientePayload) =>
    (await api.put<Cliente>(`/api/clientes/${id}`, payload)).data,
  desativar: async (id: string) => {
    await api.delete(`/api/clientes/${id}`)
  },
}

export const produtosApi = {
  listar: async (p?: ParametrosPaginacao) =>
    (await api.get<Pagina<Produto>>('/api/produtos', { params: paramsPaginacao(p) })).data,
  opcoes: async (search?: string) =>
    (
      await api.get<Produto[]>('/api/produtos/opcoes', {
        params: search?.trim() ? { search: search.trim() } : undefined,
      })
    ).data,
  cadastrar: async (payload: CadastrarProdutoPayload) =>
    (await api.post<Produto>('/api/produtos', payload)).data,
  atualizar: async (id: string, payload: AtualizarProdutoPayload) =>
    (await api.put<Produto>(`/api/produtos/${id}`, payload)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/produtos/${id}`)
  },
}

export const insumosApi = {
  listar: async (p?: ParametrosPaginacao) =>
    (await api.get<Pagina<Insumo>>('/api/insumos', { params: paramsPaginacao(p) })).data,
  opcoes: async (search?: string) =>
    (
      await api.get<Insumo[]>('/api/insumos/opcoes', {
        params: search?.trim() ? { search: search.trim() } : undefined,
      })
    ).data,
  cadastrar: async (payload: CadastrarInsumoPayload) =>
    (await api.post<Insumo>('/api/insumos', payload)).data,
  atualizar: async (id: string, payload: AtualizarInsumoPayload) =>
    (await api.put<Insumo>(`/api/insumos/${id}`, payload)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/insumos/${id}`)
  },
}

export const ferramentasApi = {
  listar: async (p?: ParametrosPaginacao) =>
    (await api.get<Pagina<Ferramenta>>('/api/ferramentas', { params: paramsPaginacao(p) })).data,
  opcoes: async () => (await api.get<Ferramenta[]>('/api/ferramentas/opcoes')).data,
  cadastrar: async (payload: CadastrarFerramentaPayload) =>
    (await api.post<Ferramenta>('/api/ferramentas', payload)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/ferramentas/${id}`)
  },
}

export const pedidosApi = {
  listar: async (periodo: Periodo, p?: ParametrosPaginacao) =>
    (
      await api.get<Pagina<Pedido>>('/api/pedidos', {
        params: { ...paramsPeriodo(periodo), ...paramsPaginacao(p) },
      })
    ).data,
  registrar: async (payload: RegistrarPedidoPayload) =>
    (await api.post<PedidoCriado>('/api/pedidos', payload)).data,
  atualizar: async (id: string, payload: AtualizarPedidoPayload) =>
    (await api.put<Pedido>(`/api/pedidos/${id}`, payload)).data,
  concretizar: async (id: string) => (await api.post<Pedido>(`/api/pedidos/${id}/concretizar`)).data,
  painelEntregas: async (horizonteDias = 7) =>
    (await api.get<PainelEntregas>('/api/pedidos/entregas/painel', { params: { horizonteDias } })).data,
  excluir: async (id: string) => {
    await api.delete(`/api/pedidos/${id}`)
  },
}

export const despesasApi = {
  listar: async (periodo: Periodo, p?: ParametrosPaginacao) =>
    (
      await api.get<Pagina<Despesa>>('/api/despesas', {
        params: { ...paramsPeriodo(periodo), ...paramsPaginacao(p) },
      })
    ).data,
  registrar: async (payload: RegistrarDespesaPayload) =>
    (await api.post('/api/despesas', payload)).data,
  atualizar: async (id: string, payload: AtualizarDespesaPayload) =>
    (await api.put<Despesa>(`/api/despesas/${id}`, payload)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/despesas/${id}`)
  },
}

export const producoesApi = {
  listar: async (periodo: Periodo, p?: ParametrosPaginacao) =>
    (
      await api.get<Pagina<Producao>>('/api/producoes', {
        params: { ...paramsPeriodo(periodo), ...paramsPaginacao(p) },
      })
    ).data,
  registrar: async (payload: RegistrarProducaoPayload) =>
    (await api.post('/api/producoes', payload)).data,
  atualizar: async (id: string, payload: AtualizarProducaoPayload) =>
    (await api.put<Producao>(`/api/producoes/${id}`, payload)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/producoes/${id}`)
  },
}

export type NotificacaoAniversarioConfig = {
  habilitada: boolean
  canal: string
  ownerEmail: string
  ownerWhatsapp: string
  whatsappApiUrl: string
}

export type DisparoAniversarioResposta = {
  dataReferencia: string
  aniversariantes: number
  notificacaoEnviada: boolean
}

export type DisparoResumoDiarioResposta = {
  dataReferencia: string
  aniversariantes: number
  entregas: number
  notificacaoEnviada: boolean
  entreguePelaApi: boolean
}

export const notificacoesApi = {
  configuracao: async () =>
    (await api.get<NotificacaoAniversarioConfig>('/api/notifications/birthdays/config')).data,
  dispararResumoDiario: async () =>
    (await api.post<DisparoAniversarioResposta>('/api/notifications/birthdays/trigger')).data,
  dispararDigestProprietaria: async () =>
    (await api.post<DisparoResumoDiarioResposta>('/api/notifications/daily-digest/trigger')).data,
}

export const precificacoesApi = {
  listar: async (p?: ParametrosPaginacao) =>
    (
      await api.get<Pagina<Precificacao>>('/api/precificacoes', { params: paramsPaginacao(p) })
    ).data,
  buscar: async (id: string) => (await api.get<Precificacao>(`/api/precificacoes/${id}`)).data,
  fichaProduto: async (produtoId: string) =>
    (await api.get<ItemPrecificacao[]>(`/api/precificacoes/ficha-produto/${produtoId}`)).data,
  simular: async (payload: SalvarPrecificacaoPayload, signal?: AbortSignal) =>
    (await api.post<SimulacaoPrecificacao>('/api/precificacoes/simular', payload, { signal })).data,
  salvar: async (payload: SalvarPrecificacaoPayload) =>
    (await api.post<Precificacao>('/api/precificacoes', payload)).data,
  atualizar: async (id: string, payload: Omit<SalvarPrecificacaoPayload, 'tipo'>) =>
    (await api.put<Precificacao>(`/api/precificacoes/${id}`, payload)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/precificacoes/${id}`)
  },
  aplicarPreco: async (id: string, produtoId?: string) =>
    (await api.post<{ produtoId: string; precoVenda: number }>(`/api/precificacoes/${id}/aplicar-preco`, null, {
      params: produtoId ? { produtoId } : undefined,
    })).data,
  publicarKit: async (id: string, nomeProduto?: string) =>
    (
      await api.post<{ produtoId: string; nome: string }>(`/api/precificacoes/${id}/publicar-kit`, null, {
        params: nomeProduto ? { nomeProduto } : undefined,
      })
    ).data,
}

export const financeiroApi = {
  resultado: async (periodo: Periodo) =>
    (
      await api.get<ResultadoFinanceiro>('/api/financeiro/resultado', {
        params: paramsPeriodo(periodo),
      })
    ).data,
}
