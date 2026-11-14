import { api } from './client'
import type {
  CadastrarClientePayload,
  CadastrarFerramentaPayload,
  CadastrarInsumoPayload,
  CadastrarProdutoPayload,
  Cliente,
  Despesa,
  Ferramenta,
  Insumo,
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

export const clientesApi = {
  listar: async () => (await api.get<Cliente[]>('/api/clientes')).data,
  aniversariantes: async () => (await api.get<Cliente[]>('/api/clientes/aniversariantes')).data,
  cadastrar: async (payload: CadastrarClientePayload) =>
    (await api.post<Cliente>('/api/clientes', payload)).data,
}

export const produtosApi = {
  listar: async () => (await api.get<Produto[]>('/api/produtos')).data,
  cadastrar: async (payload: CadastrarProdutoPayload) =>
    (await api.post<Produto>('/api/produtos', payload)).data,
}

export const insumosApi = {
  listar: async () => (await api.get<Insumo[]>('/api/insumos')).data,
  cadastrar: async (payload: CadastrarInsumoPayload) =>
    (await api.post<Insumo>('/api/insumos', payload)).data,
}

export const ferramentasApi = {
  listar: async () => (await api.get<Ferramenta[]>('/api/ferramentas')).data,
  cadastrar: async (payload: CadastrarFerramentaPayload) =>
    (await api.post<Ferramenta>('/api/ferramentas', payload)).data,
}

export const pedidosApi = {
  listar: async ({ inicio, fim }: Periodo) =>
    (await api.get<Pedido[]>('/api/pedidos', { params: { inicio, fim } })).data,
  registrar: async (payload: RegistrarPedidoPayload) =>
    (await api.post<PedidoCriado>('/api/pedidos', payload)).data,
}

export const despesasApi = {
  listar: async ({ inicio, fim }: Periodo) =>
    (await api.get<Despesa[]>('/api/despesas', { params: { inicio, fim } })).data,
  registrar: async (payload: RegistrarDespesaPayload) =>
    (await api.post('/api/despesas', payload)).data,
}

export const producoesApi = {
  listar: async ({ inicio, fim }: Periodo) =>
    (await api.get<Producao[]>('/api/producoes', { params: { inicio, fim } })).data,
  registrar: async (payload: RegistrarProducaoPayload) =>
    (await api.post('/api/producoes', payload)).data,
}

export const financeiroApi = {
  resultado: async ({ inicio, fim }: Periodo) =>
    (await api.get<ResultadoFinanceiro>('/api/financeiro/resultado', { params: { inicio, fim } }))
      .data,
}
