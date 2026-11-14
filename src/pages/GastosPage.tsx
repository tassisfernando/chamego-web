import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { despesasApi, ferramentasApi, insumosApi } from '@/api/services'
import { Paginacao } from '@/components/Paginacao'
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
  Select,
  TableShell,
  Td,
  Textarea,
  Th,
} from '@/components/ui'
import { usePaginacao } from '@/hooks/usePaginacao'
import { usePeriodo } from '@/hooks/usePeriodo'
import { tipoDespesaLabel, unidadeLabel } from '@/lib/labels'
import { minDataOperacao } from '@/lib/periodo'
import { formatCurrency, formatDate, parseApiError, todayIso } from '@/lib/utils'
import type { Despesa, TipoDespesa, UnidadeMedida } from '@/types/api'

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
  const { modo, ano, mes, periodo, setModo, setAno, setMes } = usePeriodo()
  const { pagina, tamanho, setPagina, setTamanho } = usePaginacao()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Despesa | null>(null)
  const [form, setForm] = useState(emptyForm)

  const despesas = useQuery({
    queryKey: ['despesas', periodo, pagina, tamanho],
    queryFn: () =>
      despesasApi.listar(periodo, { page: pagina, size: tamanho, sort: 'dataDespesa,desc' }),
  })
  const insumos = useQuery({ queryKey: ['insumos-opcoes'], queryFn: insumosApi.opcoes })
  const ferramentas = useQuery({ queryKey: ['ferramentas-opcoes'], queryFn: ferramentasApi.opcoes })

  const lista = despesas.data?.conteudo ?? []

  function fecharModal() {
    setOpen(false)
    setEditando(null)
    setForm({ ...emptyForm, dataDespesa: todayIso() })
  }

  function abrirNovo() {
    setEditando(null)
    setForm({ ...emptyForm, dataDespesa: todayIso() })
    setOpen(true)
  }

  function abrirEdicao(despesa: Despesa) {
    setEditando(despesa)
    setForm({
      descricao: despesa.descricao,
      dataDespesa: despesa.dataDespesa,
      valor: String(despesa.valor),
      quantidade: despesa.quantidade != null ? String(despesa.quantidade) : '',
      unidadeMedida: despesa.unidadeMedida ?? 'UN',
      tipo: despesa.tipo,
      insumoId: despesa.insumoId ?? '',
      ferramentaId: despesa.ferramentaId ?? '',
      observacao: despesa.observacao ?? '',
    })
    setOpen(true)
  }

  function montarPayload() {
    return {
      descricao: form.descricao.trim(),
      dataDespesa: form.dataDespesa,
      valor: Number(form.valor),
      quantidade: form.quantidade ? Number(form.quantidade) : undefined,
      unidadeMedida: form.quantidade ? form.unidadeMedida : undefined,
      tipo: form.tipo,
      insumoId: form.tipo === 'INSUMO' ? form.insumoId : undefined,
      ferramentaId: form.tipo === 'FERRAMENTA' ? form.ferramentaId : undefined,
      observacao: form.observacao.trim() || undefined,
    }
  }

  const registrar = useMutation({
    mutationFn: despesasApi.registrar,
    onSuccess: () => {
      toast.success('Gasto registrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['despesas'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['insumos-opcoes'] })
      queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      queryClient.invalidateQueries({ queryKey: ['ferramentas-opcoes'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível registrar o gasto.')),
  })

  const atualizar = useMutation({
    mutationFn: ({ id }: { id: string }) => despesasApi.atualizar(id, montarPayload()),
    onSuccess: () => {
      toast.success('Gasto atualizado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['despesas'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['insumos-opcoes'] })
      queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      queryClient.invalidateQueries({ queryKey: ['ferramentas-opcoes'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível atualizar o gasto.')),
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

    if (editando) {
      atualizar.mutate({ id: editando.id })
      return
    }
    registrar.mutate(montarPayload())
  }

  const salvando = registrar.isPending || atualizar.isPending

  return (
    <div>
      <PageHeader
        title="Gastos"
        description="Saídas do período: compras de material, ferramentas e custos operacionais."
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
              Novo gasto
            </Button>
          </>
        }
      />

      {despesas.isLoading ? <LoadingBlock /> : null}
      {!despesas.isLoading && lista.length === 0 ? (
        <EmptyState
          title="Nenhum gasto neste período"
          description="Registre compras e saídas para acompanhar o resultado."
        />
      ) : null}

      {lista.length > 0 ? (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Descrição</Th>
                <Th>Tipo</Th>
                <Th>Qtde</Th>
                <Th>Valor</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/70">
              {lista.map((despesa) => (
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
                  <Td>
                    <Button type="button" variant="ghost" onClick={() => abrirEdicao(despesa)}>
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {despesas.data ? (
            <Paginacao meta={despesas.data} onPaginaChange={setPagina} onTamanhoChange={setTamanho} />
          ) : null}
        </>
      ) : null}

      <Modal
        open={open}
        onClose={fecharModal}
        title={editando ? 'Editar gasto' : 'Novo gasto'}
        description="Compras de insumo atualizam o estoque automaticamente."
        wide
      >
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
                min={minDataOperacao()}
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
            <Button type="button" variant="secondary" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar gasto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}