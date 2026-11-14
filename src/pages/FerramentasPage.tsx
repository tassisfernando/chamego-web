import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ferramentasApi } from '@/api/services'
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
import { unidadeLabel } from '@/lib/labels'
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
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const ferramentas = useQuery({ queryKey: ['ferramentas'], queryFn: ferramentasApi.listar })

  const cadastrar = useMutation({
    mutationFn: ferramentasApi.cadastrar,
    onSuccess: () => {
      toast.success('Ferramenta cadastrada com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      setForm({ ...emptyForm, dataCompra: todayIso() })
      setOpen(false)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível cadastrar a ferramenta.')),
  })

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (ferramentas.data ?? []).filter((item) => {
      if (!termo) return true
      return item.nome.toLowerCase().includes(termo)
    })
  }, [busca, ferramentas.data])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    cadastrar.mutate({
      nome: form.nome.trim(),
      quantidade: Number(form.quantidade) || 1,
      unidadeMedida: form.unidadeMedida,
      valorAquisicao: form.valorAquisicao ? Number(form.valorAquisicao) : 0,
      dataCompra: form.dataCompra || undefined,
      observacao: form.observacao.trim() || undefined,
    })
  }

  return (
    <div>
      <PageHeader
        title="Ferramentas"
        description="Patrimônio da produção: balanças, moldes, termômetros e utensílios."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Nova ferramenta
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar ferramenta…" />
      </div>

      {ferramentas.isLoading ? <LoadingBlock /> : null}
      {!ferramentas.isLoading && filtradas.length === 0 ? (
        <EmptyState title="Nenhuma ferramenta cadastrada" description="Cadastre os utensílios usados na fabricação." />
      ) : null}

      {filtradas.length > 0 ? (
        <TableShell>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th>Qtde</Th>
              <Th>Valor</Th>
              <Th>Compra</Th>
              <Th>Obs.</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/70">
            {filtradas.map((item) => (
              <tr key={item.id}>
                <Td className="font-medium">{item.nome}</Td>
                <Td>
                  {item.quantidade} {item.unidadeMedida.toLowerCase()}
                </Td>
                <Td>{formatCurrency(item.valorAquisicao)}</Td>
                <Td>{formatDate(item.dataCompra)}</Td>
                <Td>{item.observacao || '—'}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova ferramenta" description="Cadastre um item do patrimônio.">
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field label="Nome">
            <Input required value={form.nome} onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value }))} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Quantidade">
              <Input
                type="number"
                min={0}
                step="0.001"
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
            <Field label="Valor (R$)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.valorAquisicao}
                onChange={(e) => setForm((a) => ({ ...a, valorAquisicao: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Data da compra">
            <Input
              type="date"
              value={form.dataCompra}
              onChange={(e) => setForm((a) => ({ ...a, dataCompra: e.target.value }))}
            />
          </Field>
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
    </div>
  )
}
