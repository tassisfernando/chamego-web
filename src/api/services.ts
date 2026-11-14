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
  ParametrosPaginacao,
  Pedido,
  PedidoCriado,
  Periodo,
  Producao,
  Produto,
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
  opcoes: async () => (await api.get<Cliente[]>('/api/clientes/opcoes')).data,
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
  opcoes: async () => (await api.get<Produto[]>('/api/produtos/opcoes')).data,
  cadastrar: async (payload: CadastrarProdutoPayload) =>
    (await api.post<Produto>('/api/produtos', payload)).data,
  atualizar: async (id: string, payload: AtualizarProdutoPayload) =>
    (await api.put<Produto>(`/api/produtos/${id}`, payload)).data,
}

export const insumosApi = {
  listar: async (p?: ParametrosPaginacao) =>
    (await api.get<Pagina<Insumo>>('/api/insumos', { params: paramsPaginacao(p) })).data,
  opcoes: async () => (await api.get<Insumo[]>('/api/insumos/opcoes')).data,
  cadastrar: async (payload: CadastrarInsumoPayload) =>
    (await api.post<Insumo>('/api/insumos', payload)).data,
  atualizar: async (id: string, payload: AtualizarInsumoPayload) =>
    (await api.put<Insumo>(`/api/insumos/${id}`, payload)).data,
}

export const ferramentasApi = {
  listar: async (p?: ParametrosPaginacao) =>
    (await api.get<Pagina<Ferramenta>>('/api/ferramentas', { params: paramsPaginacao(p) })).data,
  opcoes: async () => (await api.get<Ferramenta[]>('/api/ferramentas/opcoes')).data,
  cadastrar: async (payload: CadastrarFerramentaPayload) =>
    (await api.post<Ferramenta>('/api/ferramentas', payload)).data,
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
}

export const financeiroApi = {
  resultado: async (periodo: Periodo) =>
    (
      await api.get<ResultadoFinanceiro>('/api/financeiro/resultado', {
        params: paramsPeriodo(periodo),
      })
    ).data,
}
