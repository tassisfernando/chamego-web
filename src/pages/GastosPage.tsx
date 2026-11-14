import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { despesasApi, ferramentasApi, insumosApi } from '@/api/services'
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
import { tipoDespesaLabel, unidadeLabel } from '@/lib/labels'
import { formatCurrency, formatDate, parseApiError, todayIso } from '@/lib/utils'
import type { TipoDespesa, UnidadeMedida } from '@/types/api'

const emptyForm = {
  descricao: '',
  dataDespesa: todayIso(),
  valor: '',
  quantidade: '',
  unidadeMedida: 'UN' as UnidadeMedida,
  tipo: 'OPERACIONAL' as TipoDespesa,
  insumoId: '',
  ferramentaId: '',
  observacao: '',
}

export function GastosPage() {
  const queryClient = useQueryClient()
  const { ano, mes, periodo, setPeriodo } = usePeriodo()
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const despesas = useQuery({
    queryKey: ['despesas', periodo],
    queryFn: () => despesasApi.listar(periodo),
  })
  const insumos = useQuery({ queryKey: ['insumos'], queryFn: insumosApi.listar })
  const ferramentas = useQuery({ queryKey: ['ferramentas'], queryFn: ferramentasApi.listar })

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (despesas.data ?? []).filter((despesa) => {
      if (!termo) return true
      return (
        despesa.descricao.toLowerCase().includes(termo) ||
        tipoDespesaLabel[despesa.tipo].toLowerCase().includes(termo)
      )
    })
  }, [busca, despesas.data])

  const registrar = useMutation({
    mutationFn: despesasApi.registrar,
    onSuccess: () => {
      toast.success('Gasto registrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['despesas'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      setForm({ ...emptyForm, dataDespesa: todayIso() })
      setOpen(false)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível registrar o gasto.')),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (form.tipo === 'INSUMO' && !form.insumoId) {
      toast.error('Selecione o material comprado.')
      return
    }
    if (form.tipo === 'FERRAMENTA' && !form.ferramentaId) {
      toast.error('Selecione a ferramenta.')
      return
    }

    registrar.mutate({
      descricao: form.descricao.trim(),
      dataDespesa: form.dataDespesa,
      valor: Number(form.valor),
      quantidade: form.quantidade ? Number(form.quantidade) : undefined,
      unidadeMedida: form.quantidade ? form.unidadeMedida : undefined,
      tipo: form.tipo,
      insumoId: form.tipo === 'INSUMO' ? form.insumoId : undefined,
      ferramentaId: form.tipo === 'FERRAMENTA' ? form.ferramentaId : undefined,
      observacao: form.observacao.trim() || undefined,
    })
  }

  return (
    <div>
      <PageHeader
        title="Gastos"
        description="Saídas do período: compras de material, ferramentas e custos operacionais."
        actions={
          <>
            <PeriodoFiltro ano={ano} mes={mes} onChange={setPeriodo} />
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Novo gasto
            </Button>
          </>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar gasto…" />
      </div>

      {despesas.isLoading ? <LoadingBlock /> : null}
      {!despesas.isLoading && filtrados.length === 0 ? (
        <EmptyState title="Nenhum gasto neste período" description="Registre compras e saídas para acompanhar o resultado." />
      ) : null}

      {filtrados.length > 0 ? (
        <TableShell>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Descrição</Th>
              <Th>Tipo</Th>
              <Th>Qtde</Th>
              <Th>Valor</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/70">
            {filtrados.map((despesa) => (
              <tr key={despesa.id}>
                <Td>{formatDate(despesa.dataDespesa)}</Td>
                <Td className="font-medium">{despesa.descricao}</Td>
                <Td>
                  <Badge tone="warn">{tipoDespesaLabel[despesa.tipo]}</Badge>
                </Td>
                <Td>
                  {despesa.quantidade
                    ? `${despesa.quantidade} ${despesa.unidadeMedida?.toLowerCase() ?? ''}`
                    : '—'}
                </Td>
                <Td>{formatCurrency(despesa.valor)}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo gasto" description="Compras de insumo atualizam o estoque automaticamente." wide>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field label="Descrição">
            <Input
              required
              value={form.descricao}
              onChange={(e) => setForm((a) => ({ ...a, descricao: e.target.value }))}
              placeholder="Ex.: Essência lavanda 100 ml"
            />
          </Field>

          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Data">
              <Input
                type="date"
                required
                value={form.dataDespesa}
                onChange={(e) => setForm((a) => ({ ...a, dataDespesa: e.target.value }))}
              />
            </Field>
            <Field label="Valor (R$)">
              <Input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.valor}
                onChange={(e) => setForm((a) => ({ ...a, valor: e.target.value }))}
              />
            </Field>
            <Field label="Tipo">
              <Select
                value={form.tipo}
                onChange={(e) => setForm((a) => ({ ...a, tipo: e.target.value as TipoDespesa }))}
              >
                {Object.entries(tipoDespesaLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {form.tipo === 'INSUMO' ? (
            <Field label="Material comprado">
              <Select
                required
                value={form.insumoId}
                onChange={(e) => setForm((a) => ({ ...a, insumoId: e.target.value }))}
              >
                <option value="">Selecione…</option>
                {(insumos.data ?? []).map((insumo) => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nome}
                    {insumo.marca ? ` · ${insumo.marca}` : ''}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          {form.tipo === 'FERRAMENTA' ? (
            <Field label="Ferramenta">
              <Select
                required
                value={form.ferramentaId}
                onChange={(e) => setForm((a) => ({ ...a, ferramentaId: e.target.value }))}
              >
                <option value="">Selecione…</option>
                {(ferramentas.data ?? []).map((ferramenta) => (
                  <option key={ferramenta.id} value={ferramenta.id}>
                    {ferramenta.nome}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Quantidade" hint="Obrigatória para compra de material">
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
              {registrar.isPending ? 'Salvando…' : 'Salvar gasto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
