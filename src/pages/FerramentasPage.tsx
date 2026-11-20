import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ferramentasApi } from '@/api/services'
import { Paginacao } from '@/components/Paginacao'
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
import { unidadeLabel } from '@/lib/labels'
import { minDataOperacao } from '@/lib/periodo'
import { formatCurrency, formatDate, parseApiError, todayIso } from '@/lib/utils'
import type { UnidadeMedida } from '@/types/api'

const emptyForm = {
  nome: '',
  quantidade: '1',
  unidadeMedida: 'UN' as UnidadeMedida,
  valorAquisicao: '',
  dataCompra: todayIso(),
  observacao: '',
}

export function FerramentasPage() {
  const queryClient = useQueryClient()
  const { pagina, tamanho, setPagina, setTamanho } = usePaginacao()
  const [open, setOpen] = useState(false)
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState<{ id: string; nome: string } | null>(
    null,
  )
  const [form, setForm] = useState(emptyForm)

  const ferramentas = useQuery({
    queryKey: ['ferramentas', pagina, tamanho],
    queryFn: () => ferramentasApi.listar({ page: pagina, size: tamanho, sort: 'nome' }),
  })

  const cadastrar = useMutation({
    mutationFn: ferramentasApi.cadastrar,
    onSuccess: () => {
      toast.success('Ferramenta cadastrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      queryClient.invalidateQueries({ queryKey: ['ferramentas-opcoes'] })
      setForm({ ...emptyForm, dataCompra: todayIso() })
      setOpen(false)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível cadastrar a ferramenta.')),
  })

  const excluir = useMutation({
    mutationFn: ferramentasApi.excluir,
    onSuccess: () => {
      toast.success('Ferramenta excluída.')
      queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      queryClient.invalidateQueries({ queryKey: ['ferramentas-opcoes'] })
      setConfirmacaoExcluir(null)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível excluir a ferramenta.')),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    cadastrar.mutate({
      nome: form.nome.trim(),
      quantidade: form.quantidade ? Number(form.quantidade) : undefined,
      unidadeMedida: form.unidadeMedida,
      valorAquisicao: form.valorAquisicao ? Number(form.valorAquisicao) : undefined,
      dataCompra: form.dataCompra || undefined,
      observacao: form.observacao.trim() || undefined,
    })
  }

  const lista = ferramentas.data?.conteudo ?? []

  return (
    <div>
      <PageHeader
        title="Ferramentas"
        description="Equipamentos e utensílios da produção artesanal."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Nova ferramenta
          </Button>
        }
      />

      {ferramentas.isLoading ? <LoadingBlock /> : null}
      {!ferramentas.isLoading && lista.length === 0 ? (
        <EmptyState title="Nenhuma ferramenta cadastrada" description="Cadastre derretedeiras, balanças e moldes." />
      ) : null}

      {lista.length > 0 ? (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Qtde</Th>
                <Th>Valor</Th>
                <Th>Compra</Th>
                <Th>Observação</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/70">
              {lista.map((ferramenta) => (
                <tr key={ferramenta.id}>
                  <Td className="font-medium">{ferramenta.nome}</Td>
                  <Td>
                    {ferramenta.quantidade} {unidadeLabel[ferramenta.unidadeMedida]}
                  </Td>
                  <Td>{formatCurrency(ferramenta.valorAquisicao)}</Td>
                  <Td>{formatDate(ferramenta.dataCompra)}</Td>
                  <Td>{ferramenta.observacao || '—'}</Td>
                  <Td>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmacaoExcluir({ id: ferramenta.id, nome: ferramenta.nome })}
                    >
                      <Trash2 className="size-4" />
                      Excluir
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {ferramentas.data ? (
            <Paginacao
              meta={ferramentas.data}
              onPaginaChange={setPagina}
              onTamanhoChange={setTamanho}
            />
          ) : null}
        </>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova ferramenta">
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field label="Nome">
            <Input
              required
              value={form.nome}
              onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value }))}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Quantidade">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.quantidade}
                onChange={(e) => setForm((a) => ({ ...a, quantidade: e.target.value }))}
              />
            </Field>
            <Field label="Unidade">
              <Select
                value={form.unidadeMedida}
                onChange={(e) => setForm((a) => ({ ...a, unidadeMedida: e.target.value as UnidadeMedida }))}
              >
                {Object.entries(unidadeLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valor de aquisição">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.valorAquisicao}
                onChange={(e) => setForm((a) => ({ ...a, valorAquisicao: e.target.value }))}
              />
            </Field>
            <Field label="Data da compra">
              <Input
                type="date"
                min={minDataOperacao()}
                value={form.dataCompra}
                onChange={(e) => setForm((a) => ({ ...a, dataCompra: e.target.value }))}
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
            <Button type="submit" disabled={cadastrar.isPending}>
              {cadastrar.isPending ? 'Salvando…' : 'Salvar ferramenta'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmacaoExcluir}
        onClose={() => setConfirmacaoExcluir(null)}
        title="Excluir ferramenta"
        description="A ferramenta será removida permanentemente do cadastro."
      >
        <p className="text-sm text-ink-soft">
          Confirma excluir <strong>{confirmacaoExcluir?.nome}</strong>?
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
