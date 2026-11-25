import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { clientesApi, pedidosApi, produtosApi } from '@/api/services'
import { Paginacao } from '@/components/Paginacao'
import { PeriodoFiltro } from '@/components/PeriodoFiltro'
import { ClienteCombobox } from '@/components/ClienteCombobox'
import { ProductCombobox } from '@/components/ProductCombobox'
import { QuickClienteCadastroModal } from '@/components/QuickClienteCadastroModal'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
  TableShell,
  Td,
  Textarea,
  Th,
} from '@/components/ui'
import { usePaginacao } from '@/hooks/usePaginacao'
import { usePeriodo } from '@/hooks/usePeriodo'
import { naturezaPedidoLabel, statusPedidoLabel } from '@/lib/labels'
import { totaisPedido } from '@/lib/pedidoTotais'
import { minDataOperacao } from '@/lib/periodo'
import { formatCurrency, formatDate, parseApiError, todayIso, todayIsoSaoPaulo } from '@/lib/utils'
import type { AtualizarPedidoPayload, Cliente, NaturezaPedido, Pedido, StatusPedido } from '@/types/api'

type ItemForm = {
  produtoId: string
  quantidade: string
  precoUnitario: string
  descontoPercentual: string
}

type FiltroLista = 'TODOS' | 'ORCAMENTO' | 'CONFIRMADO'

const emptyItem = (): ItemForm => ({
  produtoId: '',
  quantidade: '1',
  precoUnitario: '',
  descontoPercentual: '',
})

function statusBadgeTone(status: StatusPedido): 'ok' | 'warn' | 'neutral' | 'danger' {
  if (status === 'CONFIRMADO') return 'ok'
  if (status === 'ORCAMENTO') return 'warn'
  if (status === 'CANCELADO') return 'danger'
  return 'neutral'
}

function destaqueEntrega(dataEntrega: string | null | undefined, status: StatusPedido) {
  if (!dataEntrega || status === 'CANCELADO') return null
  const hoje = todayIsoSaoPaulo()
  if (dataEntrega === hoje) {
    return { selo: 'Hoje', tone: 'ok' as const, atrasada: false }
  }
  if (dataEntrega < hoje) {
    return { selo: 'Atrasada', tone: 'danger' as const, atrasada: true }
  }
  return { selo: null, tone: 'neutral' as const, atrasada: false }
}

export function VendasPage() {
  const queryClient = useQueryClient()
  const { modo, ano, mes, periodo, setModo, setAno, setMes } = usePeriodo()
  const { pagina, tamanho, setPagina, setTamanho } = usePaginacao()
  const [open, setOpen] = useState(false)
  const [openNovoCliente, setOpenNovoCliente] = useState(false)
  const [editando, setEditando] = useState<Pedido | null>(null)
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState<Pedido | null>(null)
  const [filtroLista, setFiltroLista] = useState<FiltroLista>('TODOS')
  const [clienteId, setClienteId] = useState('')
  const [dataPedido, setDataPedido] = useState(todayIso())
  const [dataEntrega, setDataEntrega] = useState('')
  const [natureza, setNatureza] = useState<NaturezaPedido>('VENDA')
  const [status, setStatus] = useState<StatusPedido>('CONFIRMADO')
  const [observacao, setObservacao] = useState('')
  const [descontoPercentualPedido, setDescontoPercentualPedido] = useState('')
  const [itens, setItens] = useState<ItemForm[]>([emptyItem()])

  const clientes = useQuery({
    queryKey: ['clientes-opcoes'],
    queryFn: () => clientesApi.opcoes(),
  })
  const produtos = useQuery({ queryKey: ['produtos-opcoes'], queryFn: () => produtosApi.opcoes() })
  const statusLista =
    filtroLista === 'TODOS' ? undefined : (filtroLista as StatusPedido)

  const pedidos = useQuery({
    queryKey: ['pedidos', periodo, pagina, tamanho, filtroLista],
    queryFn: () =>
      pedidosApi.listar(periodo, {
        page: pagina,
        size: tamanho,
        sort: 'dataPedido,desc',
        status: statusLista,
      }),
  })

  const clienteMap = useMemo(
    () => new Map((clientes.data ?? []).map((cliente) => [cliente.id, cliente.nome])),
    [clientes.data],
  )
  const produtoMap = useMemo(
    () => new Map((produtos.data ?? []).map((produto) => [produto.id, produto])),
    [produtos.data],
  )

  const totais = useMemo(() => {
    const itensNumericos = itens
      .filter((item) => item.produtoId && Number(item.quantidade) > 0)
      .map((item) => ({
        quantidade: Number(item.quantidade) || 0,
        precoUnitario: Number(item.precoUnitario) || 0,
        descontoPercentual: Number(item.descontoPercentual) || 0,
      }))
  return totaisPedido(itensNumericos, Number(descontoPercentualPedido) || 0)
  }, [itens, descontoPercentualPedido])

  const lista = pedidos.data?.conteudo ?? []

  function invalidarPedidos() {
    queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    queryClient.invalidateQueries({ queryKey: ['entregas-painel'] })
    queryClient.invalidateQueries({ queryKey: ['financeiro'] })
    queryClient.invalidateQueries({ queryKey: ['produtos'] })
    queryClient.invalidateQueries({ queryKey: ['produtos-opcoes'] })
  }

  function aoClienteRapidoCriado(cliente: Cliente) {
    const inserir = (listaAnterior?: Cliente[]) => {
      const lista = listaAnterior ?? []
      if (lista.some((item) => item.id === cliente.id)) {
        return lista
      }
      return [...lista, cliente].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    }
    queryClient.setQueryData<Cliente[]>(['clientes-opcoes'], inserir)
    queryClient.setQueryData<Cliente[]>(['clientes-busca'], inserir)
    setClienteId(cliente.id)
    queryClient.invalidateQueries({ queryKey: ['clientes'] })
    queryClient.invalidateQueries({ queryKey: ['clientes-busca'] })
    queryClient.invalidateQueries({ queryKey: ['aniversariantes-painel'] })
  }

  function fecharModal() {
    setOpen(false)
    setEditando(null)
    setClienteId('')
    setDataPedido(todayIso())
    setDataEntrega('')
    setNatureza('VENDA')
    setStatus('CONFIRMADO')
    setObservacao('')
    setDescontoPercentualPedido('')
    setItens([emptyItem()])
  }

  function abrirNovo() {
    fecharModal()
    setOpen(true)
  }

  function abrirEdicao(pedido: Pedido) {
    setEditando(pedido)
    setClienteId(pedido.clienteId)
    setDataPedido(pedido.dataPedido)
    setDataEntrega(pedido.dataEntrega ?? '')
    setNatureza(pedido.natureza)
    setStatus(pedido.status)
    setObservacao(pedido.observacao ?? '')
    setDescontoPercentualPedido(
      pedido.descontoPercentual != null ? String(pedido.descontoPercentual) : '',
    )
    setItens(
      pedido.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: String(item.quantidade),
        precoUnitario: String(item.precoUnitario),
        descontoPercentual:
          item.descontoPercentual != null ? String(item.descontoPercentual) : '',
      })),
    )
    setOpen(true)
  }

  const registrar = useMutation({
    mutationFn: pedidosApi.registrar,
    onSuccess: (pedido) => {
      toast.success(`Pedido registrado · total ${formatCurrency(pedido.valorTotal)}`)
      invalidarPedidos()
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível registrar o pedido.')),
  })

  const atualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarPedidoPayload }) =>
      pedidosApi.atualizar(id, payload),
    onSuccess: () => {
      toast.success('Pedido atualizado com sucesso.')
      invalidarPedidos()
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível atualizar o pedido.')),
  })

  const concretizar = useMutation({
    mutationFn: pedidosApi.concretizar,
    onSuccess: (pedido) => {
      toast.success(`Venda concretizada · total ${formatCurrency(pedido.valorTotal)}`)
      invalidarPedidos()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível concretizar a venda.')),
  })

  const excluir = useMutation({
    mutationFn: pedidosApi.excluir,
    onSuccess: () => {
      toast.success('Pedido excluído.')
      invalidarPedidos()
      setConfirmacaoExcluir(null)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível excluir o pedido.')),
  })

  function atualizarItem(index: number, patch: Partial<ItemForm>) {
    setItens((atual) => atual.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function montarItensValidos() {
    return itens
      .filter((item) => item.produtoId && Number(item.quantidade) > 0)
      .map((item) => ({
        produtoId: item.produtoId,
        quantidade: Number(item.quantidade),
        precoUnitario: Number(item.precoUnitario) || 0,
        descontoPercentual: Number(item.descontoPercentual) || undefined,
      }))
  }

  function validarFormulario() {
    const itensValidos = montarItensValidos()
    if (!clienteId) {
      toast.error('Escolha a cliente do pedido.')
      return null
    }
    if (itensValidos.length === 0) {
      toast.error('Adicione pelo menos um produto.')
      return null
    }
    const descontoPedido = Number(descontoPercentualPedido)
    return {
      clienteId,
      dataPedido,
      dataEntrega: dataEntrega || undefined,
      natureza,
      observacao: observacao.trim() || undefined,
      descontoPercentual: descontoPedido > 0 ? descontoPedido : undefined,
      itens: itensValidos,
    }
  }

  function salvarNovo(confirmarVenda: boolean) {
    const base = validarFormulario()
    if (!base) return
    registrar.mutate({ ...base, confirmarVenda })
  }

  function onSubmitEdicao(event: FormEvent) {
    event.preventDefault()
    const base = validarFormulario()
    if (!base || !editando) return
    atualizar.mutate({
      id: editando.id,
      payload: { ...base, status },
    })
  }

  const salvando = registrar.isPending || atualizar.isPending

  return (
    <div>
      <PageHeader
        title="Vendas"
        description="Registre pedidos com cliente, itens, descontos e total automático."
        actions={
          <>
            <PeriodoFiltro
              modo={modo}
              ano={ano}
              mes={mes}
              onModoChange={(m) => {
                setModo(m)
                setPagina(0)
              }}
              onAnoChange={(a) => {
                setAno(a)
                setPagina(0)
              }}
              onMesChange={(m) => {
                setMes(m)
                setPagina(0)
              }}
            />
            <Button type="button" onClick={abrirNovo}>
              <Plus className="size-4" />
              Nova venda
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['TODOS', 'Todos'],
            ['ORCAMENTO', 'Orçamentos'],
            ['CONFIRMADO', 'Vendas confirmadas'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={filtroLista === value ? 'primary' : 'secondary'}
            onClick={() => {
              setFiltroLista(value)
              setPagina(0)
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {pedidos.isLoading ? <LoadingBlock /> : null}
      {!pedidos.isLoading && lista.length === 0 ? (
        <EmptyState
          title={
            filtroLista === 'TODOS'
              ? 'Nenhum pedido neste período'
              : filtroLista === 'ORCAMENTO'
                ? 'Nenhum orçamento neste período'
                : 'Nenhuma venda confirmada neste período'
          }
          description="Registre um novo pedido ou ajuste o período ou o filtro."
        />
      ) : null}

      {lista.length > 0 ? (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Entrega</Th>
                <Th>Cliente</Th>
                <Th>Tipo</Th>
                <Th>Status</Th>
                <Th>Itens</Th>
                <Th>Total</Th>
                <Th>Lucro</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/70">
              {lista.map((pedido) => {
                const entrega = destaqueEntrega(pedido.dataEntrega, pedido.status)
                return (
                <tr key={pedido.id}>
                  <Td>{formatDate(pedido.dataPedido)}</Td>
                  <Td>
                    {entrega ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={entrega.atrasada ? 'font-medium text-danger' : undefined}>
                          {formatDate(pedido.dataEntrega)}
                        </span>
                        {entrega.selo ? <Badge tone={entrega.tone}>{entrega.selo}</Badge> : null}
                      </div>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </Td>
                  <Td className="font-medium">{clienteMap.get(pedido.clienteId) ?? 'Cliente'}</Td>
                  <Td>{naturezaPedidoLabel[pedido.natureza]}</Td>
                  <Td>
                    <Badge tone={statusBadgeTone(pedido.status)}>
                      {statusPedidoLabel[pedido.status]}
                    </Badge>
                  </Td>
                  <Td>
                    {pedido.itens
                      .map((item) => {
                        const produto = produtoMap.get(item.produtoId)
                        return `${produto?.nome ?? 'Produto'} × ${item.quantidade}`
                      })
                      .join(', ')}
                  </Td>
                  <Td>{formatCurrency(pedido.valorTotal)}</Td>
                  <Td>{formatCurrency(pedido.lucroBruto)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button type="button" variant="ghost" onClick={() => abrirEdicao(pedido)}>
                        <Pencil className="size-4" />
                        Editar
                      </Button>
                      {pedido.status === 'ORCAMENTO' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-ok hover:bg-ok/10 hover:text-ok"
                          disabled={concretizar.isPending}
                          onClick={() => concretizar.mutate(pedido.id)}
                        >
                          <CheckCircle2 className="size-4" />
                          Concretizar venda
                        </Button>
                      ) : null}
                      <Button type="button" variant="ghost" onClick={() => setConfirmacaoExcluir(pedido)}>
                        <Trash2 className="size-4" />
                        Excluir
                      </Button>
                    </div>
                  </Td>
                </tr>
                )
              })}
            </tbody>
          </TableShell>
          {pedidos.data ? (
            <Paginacao meta={pedidos.data} onPaginaChange={setPagina} onTamanhoChange={setTamanho} />
          ) : null}
        </>
      ) : null}

      <Modal
        open={open}
        wide
        onClose={fecharModal}
        title={editando ? 'Editar pedido' : 'Nova venda'}
        description="Escolha a cliente e os produtos. Os totais atualizam conforme descontos."
      >
        <form className="grid gap-4" onSubmit={editando ? onSubmitEdicao : (e) => e.preventDefault()}>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Cliente" className="md:col-span-2">
              <div className="flex flex-wrap items-stretch gap-2">
                <ClienteCombobox
                  value={clienteId}
                  nomeExibicao={clienteId ? clienteMap.get(clienteId) : undefined}
                  onSelect={(cliente) => setClienteId(cliente?.id ?? '')}
                />
                <Button type="button" variant="secondary" onClick={() => setOpenNovoCliente(true)}>
                  <Plus className="size-4" />
                  Novo cliente
                </Button>
              </div>
            </Field>
            <Field label="Data do pedido">
              <Input
                type="date"
                required
                min={minDataOperacao()}
                value={dataPedido}
                onChange={(e) => setDataPedido(e.target.value)}
              />
            </Field>
            <Field label="Data de entrega">
              <Input
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </Field>
          </div>

          <div className={`grid gap-3 ${editando ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <Field label="Tipo">
              <Select value={natureza} onChange={(e) => setNatureza(e.target.value as NaturezaPedido)}>
                {Object.entries(naturezaPedidoLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            {editando ? (
              <Field label="Status">
                <Select value={status} onChange={(e) => setStatus(e.target.value as StatusPedido)}>
                  <option value="ORCAMENTO">{statusPedidoLabel.ORCAMENTO}</option>
                  <option value="CONFIRMADO">{statusPedidoLabel.CONFIRMADO}</option>
                  <option value="CANCELADO">{statusPedidoLabel.CANCELADO}</option>
                </Select>
              </Field>
            ) : null}
            <Field label="Observação" className={editando ? undefined : 'md:col-span-1'}>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: entrega, cupom, doação…"
              />
            </Field>
          </div>

          <Field label="Desconto no pedido (%)" className="max-w-xs">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={descontoPercentualPedido}
              onChange={(e) => setDescontoPercentualPedido(e.target.value)}
              placeholder="0"
            />
          </Field>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Itens da venda</h3>
              <Button type="button" variant="secondary" onClick={() => setItens((a) => [...a, emptyItem()])}>
                <Plus className="size-4" />
                Adicionar item
              </Button>
            </div>

            {itens.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-xl border border-line bg-white/70 p-3 md:grid-cols-[1.4fr_0.5fr_0.7fr_0.5fr_auto]"
              >
                <Field label="Produto">
                  <ProductCombobox
                    value={item.produtoId}
                    onSelect={(produto) => {
                      atualizarItem(index, {
                        produtoId: produto.id,
                        precoUnitario: item.precoUnitario || String(produto.precoVenda),
                      })
                    }}
                  />
                </Field>
                <Field label="Qtde">
                  <Input
                    type="number"
                    min={1}
                    required
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(index, { quantidade: e.target.value })}
                  />
                </Field>
                <Field label="Preço unit. (R$)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={item.precoUnitario}
                    onChange={(e) => atualizarItem(index, { precoUnitario: e.target.value })}
                  />
                </Field>
                <Field label="Desc. item (%)">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={item.descontoPercentual}
                    onChange={(e) => atualizarItem(index, { descontoPercentual: e.target.value })}
                    placeholder="0"
                  />
                </Field>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={itens.length === 1}
                    onClick={() => setItens((a) => a.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 rounded-xl bg-paper-deep/60 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
              <span>Subtotal dos itens</span>
              <span>{formatCurrency(totais.subtotal)}</span>
            </div>
            {totais.descontoTotal > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
                <span>Descontos aplicados</span>
                <span>− {formatCurrency(totais.descontoTotal)}</span>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-sm font-medium text-ink">Total do pedido</p>
              <p className="font-display text-2xl font-semibold">{formatCurrency(totais.total)}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={fecharModal}>
              Cancelar
            </Button>
            {editando ? (
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={salvando}
                  onClick={() => salvarNovo(false)}
                >
                  {registrar.isPending ? 'Salvando…' : 'Salvar como Orçamento'}
                </Button>
                <Button type="button" disabled={salvando} onClick={() => salvarNovo(true)}>
                  {registrar.isPending ? 'Registrando…' : 'Concretizar Venda'}
                </Button>
              </>
            )}
          </div>
        </form>
      </Modal>

      <QuickClienteCadastroModal
        open={openNovoCliente}
        onClose={() => setOpenNovoCliente(false)}
        onClienteCriado={aoClienteRapidoCriado}
      />

      <Modal
        open={!!confirmacaoExcluir}
        onClose={() => setConfirmacaoExcluir(null)}
        title="Excluir pedido"
        description="O pedido será removido permanentemente. Esta ação não pode ser desfeita."
      >
        <p className="text-sm text-ink-soft">
          Confirma excluir o pedido de{' '}
          <strong>
            {confirmacaoExcluir ? clienteMap.get(confirmacaoExcluir.clienteId) ?? 'cliente' : ''}
          </strong>{' '}
          em{' '}
          <strong>
            {confirmacaoExcluir ? formatDate(confirmacaoExcluir.dataPedido) : ''}
          </strong>
          ?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirmacaoExcluir(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={excluir.isPending}
            onClick={() => confirmacaoExcluir && excluir.mutate(confirmacaoExcluir.id)}
          >
            {excluir.isPending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}