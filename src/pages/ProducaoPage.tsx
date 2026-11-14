import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { producoesApi, produtosApi } from '@/api/services'
import { Paginacao } from '@/components/Paginacao'
import { PeriodoFiltro } from '@/components/PeriodoFiltro'
import {
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
import { minDataOperacao } from '@/lib/periodo'
import { formatCurrency, formatDate, parseApiError, todayIso } from '@/lib/utils'
import type { Producao } from '@/types/api'

const emptyForm = {
  produtoId: '',
  dataProducao: todayIso(),
  quantidadeProduzida: '1',
  observacao: '',
}

export function ProducaoPage() {
  const queryClient = useQueryClient()
  const { modo, ano, mes, periodo, setModo, setAno, setMes } = usePeriodo()
  const { pagina, tamanho, setPagina, setTamanho } = usePaginacao()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Producao | null>(null)
  const [form, setForm] = useState(emptyForm)

  const produtos = useQuery({ queryKey: ['produtos-opcoes'], queryFn: produtosApi.opcoes })
  const producoes = useQuery({
    queryKey: ['producoes', periodo, pagina, tamanho],
    queryFn: () =>
      producoesApi.listar(periodo, { page: pagina, size: tamanho, sort: 'dataProducao,desc' }),
  })

  const produtoMap = useMemo(
    () => new Map((produtos.data ?? []).map((produto) => [produto.id, produto.nome])),
    [produtos.data],
  )

  const lista = producoes.data?.conteudo ?? []

  function fecharModal() {
    setOpen(false)
    setEditando(null)
    setForm({ ...emptyForm, dataProducao: todayIso() })
  }

  function abrirNovo() {
    setEditando(null)
    setForm({ ...emptyForm, dataProducao: todayIso() })
    setOpen(true)
  }

  function abrirEdicao(lote: Producao) {
    setEditando(lote)
    setForm({
      produtoId: lote.produtoId,
      dataProducao: lote.dataProducao,
      quantidadeProduzida: String(lote.quantidadeProduzida),
      observacao: lote.observacao ?? '',
    })
    setOpen(true)
  }

  const registrar = useMutation({
    mutationFn: producoesApi.registrar,
    onSuccess: () => {
      toast.success('Produção registrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['producoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['produtos-opcoes'] })
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['insumos-opcoes'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível registrar a produção.')),
  })

  const atualizar = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & typeof form) =>
      producoesApi.atualizar(id, {
        produtoId: payload.produtoId,
        dataProducao: payload.dataProducao,
        quantidadeProduzida: Number(payload.quantidadeProduzida),
        observacao: payload.observacao.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Produção atualizada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['producoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['produtos-opcoes'] })
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['insumos-opcoes'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível atualizar a produção.')),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const payload = {
      produtoId: form.produtoId,
      dataProducao: form.dataProducao,
      quantidadeProduzida: Number(form.quantidadeProduzida),
      observacao: form.observacao.trim() || undefined,
    }
    if (editando) {
      atualizar.mutate({ id: editando.id, ...form })
      return
    }
    registrar.mutate(payload)
  }

  const salvando = registrar.isPending || atualizar.isPending

  return (
    <div>
      <PageHeader
        title="Produção"
        description="Lotes fabricados no período, com custo unitário calculado."
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
              Nova produção
            </Button>
          </>
        }
      />

      {producoes.isLoading ? <LoadingBlock /> : null}
      {!producoes.isLoading && lista.length === 0 ? (
        <EmptyState title="Nenhuma produção neste período" description="Registre o primeiro lote fabricado." />
      ) : null}

      {lista.length > 0 ? (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Produto</Th>
                <Th>Qtde</Th>
                <Th>Custo unit.</Th>
                <Th>Custo total</Th>
                <Th>Observação</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/70">
              {lista.map((lote) => (
                <tr key={lote.id}>
                  <Td>{formatDate(lote.dataProducao)}</Td>
                  <Td className="font-medium">{produtoMap.get(lote.produtoId) ?? 'Produto'}</Td>
                  <Td>{lote.quantidadeProduzida}</Td>
                  <Td>{formatCurrency(lote.custoUnitario)}</Td>
                  <Td>{formatCurrency(lote.custoTotal)}</Td>
                  <Td>{lote.observacao || '—'}</Td>
                  <Td>
                    <Button type="button" variant="ghost" onClick={() => abrirEdicao(lote)}>
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {producoes.data ? (
            <Paginacao meta={producoes.data} onPaginaChange={setPagina} onTamanhoChange={setTamanho} />
          ) : null}
        </>
      ) : null}

      <Modal
        open={open}
        onClose={fecharModal}
        title={editando ? 'Editar produção' : 'Nova produção'}
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
                min={minDataOperacao()}
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
            <Button type="button" variant="secondary" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando
                ? 'Salvando…'
                : editando
                  ? 'Salvar alterações'
                  : 'Registrar produção'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}