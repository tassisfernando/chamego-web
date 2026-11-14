import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { clientesApi, pedidosApi, produtosApi } from '@/api/services'
import { PeriodoFiltro } from '@/components/PeriodoFiltro'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  TableShell,
  Td,
  Textarea,
  Th,
} from '@/components/ui'
import { usePeriodo } from '@/hooks/usePeriodo'
import { naturezaPedidoLabel, statusPedidoLabel } from '@/lib/labels'
import { formatCurrency, formatDate, parseApiError, todayIso } from '@/lib/utils'
import type { NaturezaPedido } from '@/types/api'

type ItemForm = {
  produtoId: string
  quantidade: string
  precoUnitario: string
}

const emptyItem = (): ItemForm => ({ produtoId: '', quantidade: '1', precoUnitario: '' })

export function VendasPage() {
  const queryClient = useQueryClient()
  const { ano, mes, periodo, setPeriodo } = usePeriodo()
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [dataPedido, setDataPedido] = useState(todayIso())
  const [natureza, setNatureza] = useState<NaturezaPedido>('VENDA')
  const [observacao, setObservacao] = useState('')
  const [itens, setItens] = useState<ItemForm[]>([emptyItem()])

  const clientes = useQuery({ queryKey: ['clientes'], queryFn: clientesApi.listar })
  const produtos = useQuery({ queryKey: ['produtos'], queryFn: produtosApi.listar })
  const pedidos = useQuery({
    queryKey: ['pedidos', periodo],
    queryFn: () => pedidosApi.listar(periodo),
  })

  const clienteMap = useMemo(
    () => new Map((clientes.data ?? []).map((cliente) => [cliente.id, cliente.nome])),
    [clientes.data],
  )
  const produtoMap = useMemo(
    () => new Map((produtos.data ?? []).map((produto) => [produto.id, produto])),
    [produtos.data],
  )

  const subtotal = itens.reduce((acc, item) => {
    const qtd = Number(item.quantidade) || 0
    const preco = Number(item.precoUnitario) || 0
    return acc + qtd * preco
  }, 0)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (pedidos.data ?? []).filter((pedido) => {
      if (!termo) return true
      const nomeCliente = clienteMap.get(pedido.clienteId) ?? ''
      return (
        nomeCliente.toLowerCase().includes(termo) ||
        naturezaPedidoLabel[pedido.natureza].toLowerCase().includes(termo)
      )
    })
  }, [busca, clienteMap, pedidos.data])

  const registrar = useMutation({
    mutationFn: pedidosApi.registrar,
    onSuccess: (pedido) => {
      toast.success(`Venda registrada · total ${formatCurrency(pedido.valorTotal)}`)
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      setOpen(false)
      setClienteId('')
      setDataPedido(todayIso())
      setNatureza('VENDA')
      setObservacao('')
      setItens([emptyItem()])
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível registrar a venda.')),
  })

  function atualizarItem(index: number, patch: Partial<ItemForm>) {
    setItens((atual) =>
      atual.map((item, i) => {
        if (i !== index) return item
        const next = { ...item, ...patch }
        if (patch.produtoId) {
          const produto = produtoMap.get(patch.produtoId)
          if (produto && !item.precoUnitario) {
            next.precoUnitario = String(produto.precoVenda)
          }
        }
        return next
      }),
    )
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const itensValidos = itens
      .filter((item) => item.produtoId && Number(item.quantidade) > 0)
      .map((item) => ({
        produtoId: item.produtoId,
        quantidade: Number(item.quantidade),
        precoUnitario: Number(item.precoUnitario) || 0,
      }))

    if (!clienteId) {
      toast.error('Escolha a cliente da venda.')
      return
    }
    if (itensValidos.length === 0) {
      toast.error('Adicione pelo menos um produto.')
      return
    }

    registrar.mutate({
      clienteId,
      dataPedido,
      natureza,
      observacao: observacao.trim() || undefined,
      itens: itensValidos,
    })
  }

  return (
    <div>
      <PageHeader
        title="Vendas"
        description="Registre pedidos com cliente, itens e total automático — como a coluna de vendas da planilha."
        actions={
          <>
            <PeriodoFiltro ano={ano} mes={mes} onChange={setPeriodo} />
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Nova venda
            </Button>
          </>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente ou tipo…"
        />
      </div>

      {pedidos.isLoading ? <LoadingBlock /> : null}
      {!pedidos.isLoading && filtrados.length === 0 ? (
        <EmptyState title="Nenhuma venda neste período" description="Registre a primeira venda do mês." />
      ) : null}

      {filtrados.length > 0 ? (
        <TableShell>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Cliente</Th>
              <Th>Tipo</Th>
              <Th>Status</Th>
              <Th>Itens</Th>
              <Th>Total</Th>
              <Th>Lucro</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/70">
            {filtrados.map((pedido) => (
              <tr key={pedido.id}>
                <Td>{formatDate(pedido.dataPedido)}</Td>
                <Td className="font-medium">{clienteMap.get(pedido.clienteId) ?? 'Cliente'}</Td>
                <Td>{naturezaPedidoLabel[pedido.natureza]}</Td>
                <Td>
                  <Badge tone={pedido.status === 'CONFIRMADO' ? 'ok' : 'neutral'}>
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
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : null}

      <Modal
        open={open}
        wide
        onClose={() => setOpen(false)}
        title="Nova venda"
        description="Escolha a cliente e os produtos. O subtotal atualiza sozinho."
      >
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Cliente" className="md:col-span-2">
              <Select required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Selecione…</option>
                {(clientes.data ?? []).map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data">
              <Input type="date" required value={dataPedido} onChange={(e) => setDataPedido(e.target.value)} />
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Tipo">
              <Select value={natureza} onChange={(e) => setNatureza(e.target.value as NaturezaPedido)}>
                {Object.entries(naturezaPedidoLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Observação">
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: entrega, cupom, doação…"
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Itens da venda</h3>
              <Button type="button" variant="secondary" onClick={() => setItens((a) => [...a, emptyItem()])}>
                <Plus className="size-4" />
                Adicionar item
              </Button>
            </div>

            {itens.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-line bg-white/70 p-3 md:grid-cols-[1.4fr_0.6fr_0.8fr_auto]">
                <Field label="Produto">
                  <Select
                    required
                    value={item.produtoId}
                    onChange={(e) => atualizarItem(index, { produtoId: e.target.value })}
                  >
                    <option value="">Selecione…</option>
                    {(produtos.data ?? []).map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} · estoque {produto.estoqueAtual}
                      </option>
                    ))}
                  </Select>
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

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper-deep/60 px-4 py-3">
            <p className="text-sm text-ink-soft">Subtotal da venda</p>
            <p className="font-display text-2xl font-semibold">{formatCurrency(subtotal)}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrar.isPending}>
              {registrar.isPending ? 'Registrando…' : 'Registrar venda'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
