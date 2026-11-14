import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { producoesApi, produtosApi } from '@/api/services'
import { PeriodoFiltro } from '@/components/PeriodoFiltro'
import {
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
import { formatCurrency, formatDate, parseApiError, todayIso } from '@/lib/utils'

const emptyForm = {
  produtoId: '',
  dataProducao: todayIso(),
  quantidadeProduzida: '1',
  observacao: '',
}

export function ProducaoPage() {
  const queryClient = useQueryClient()
  const { ano, mes, periodo, setPeriodo } = usePeriodo()
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const produtos = useQuery({ queryKey: ['produtos'], queryFn: produtosApi.listar })
  const producoes = useQuery({
    queryKey: ['producoes', periodo],
    queryFn: () => producoesApi.listar(periodo),
  })

  const produtoMap = useMemo(
    () => new Map((produtos.data ?? []).map((produto) => [produto.id, produto.nome])),
    [produtos.data],
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (producoes.data ?? []).filter((lote) => {
      if (!termo) return true
      return (produtoMap.get(lote.produtoId) ?? '').toLowerCase().includes(termo)
    })
  }, [busca, producoes.data, produtoMap])

  const registrar = useMutation({
    mutationFn: producoesApi.registrar,
    onSuccess: () => {
      toast.success('Produção registrada. Estoque de velas atualizado.')
      queryClient.invalidateQueries({ queryKey: ['producoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      setForm({ ...emptyForm, dataProducao: todayIso() })
      setOpen(false)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível registrar a produção.')),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    registrar.mutate({
      produtoId: form.produtoId,
      dataProducao: form.dataProducao,
      quantidadeProduzida: Number(form.quantidadeProduzida),
      observacao: form.observacao.trim() || undefined,
    })
  }

  return (
    <div>
      <PageHeader
        title="Produção"
        description="Registre lotes fabricados. O sistema consome a receita de materiais e aumenta o estoque da vela."
        actions={
          <>
            <PeriodoFiltro ano={ano} mes={mes} onChange={setPeriodo} />
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Nova produção
            </Button>
          </>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por produto…" />
      </div>

      {producoes.isLoading ? <LoadingBlock /> : null}
      {!producoes.isLoading && filtrados.length === 0 ? (
        <EmptyState
          title="Nenhuma produção neste período"
          description="Para produzir, o produto precisa ter receita de materiais cadastrada."
        />
      ) : null}

      {filtrados.length > 0 ? (
        <TableShell>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Produto</Th>
              <Th>Qtde</Th>
              <Th>Custo unitário</Th>
              <Th>Custo total</Th>
              <Th>Obs.</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/70">
            {filtrados.map((lote) => (
              <tr key={lote.id}>
                <Td>{formatDate(lote.dataProducao)}</Td>
                <Td className="font-medium">{produtoMap.get(lote.produtoId) ?? 'Produto'}</Td>
                <Td>{lote.quantidadeProduzida}</Td>
                <Td>{formatCurrency(lote.custoUnitario)}</Td>
                <Td>{formatCurrency(lote.custoTotal)}</Td>
                <Td>{lote.observacao || '—'}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova produção"
        description="Informe o produto e a quantidade fabricada."
      >
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field label="Produto">
            <Select
              required
              value={form.produtoId}
              onChange={(e) => setForm((a) => ({ ...a, produtoId: e.target.value }))}
            >
              <option value="">Selecione…</option>
              {(produtos.data ?? []).map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Data">
              <Input
                type="date"
                required
                value={form.dataProducao}
                onChange={(e) => setForm((a) => ({ ...a, dataProducao: e.target.value }))}
              />
            </Field>
            <Field label="Quantidade produzida">
              <Input
                type="number"
                min={1}
                required
                value={form.quantidadeProduzida}
                onChange={(e) => setForm((a) => ({ ...a, quantidadeProduzida: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Observação">
            <Textarea
              value={form.observacao}
              onChange={(e) => setForm((a) => ({ ...a, observacao: e.target.value }))}
            />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrar.isPending}>
              {registrar.isPending ? 'Registrando…' : 'Registrar produção'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
