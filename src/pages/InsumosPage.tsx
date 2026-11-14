import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { insumosApi } from '@/api/services'
import { Paginacao } from '@/components/Paginacao'
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
  Th,
} from '@/components/ui'
import { usePaginacao } from '@/hooks/usePaginacao'
import { categoriaInsumoLabel, unidadeLabel } from '@/lib/labels'
import { formatCurrency, parseApiError } from '@/lib/utils'
import type { CategoriaInsumo, Insumo, UnidadeMedida } from '@/types/api'

const emptyForm = {
  nome: '',
  categoria: 'ESSENCIA' as CategoriaInsumo,
  marca: '',
  unidadeMedida: 'ML' as UnidadeMedida,
  estoqueAtual: '',
  custoMedio: '',
}

export function InsumosPage() {
  const queryClient = useQueryClient()
  const { pagina, tamanho, setPagina, setTamanho } = usePaginacao()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Insumo | null>(null)
  const [form, setForm] = useState(emptyForm)

  const insumos = useQuery({
    queryKey: ['insumos', pagina, tamanho],
    queryFn: () => insumosApi.listar({ page: pagina, size: tamanho, sort: 'nome' }),
  })

  function fecharModal() {
    setOpen(false)
    setEditando(null)
    setForm(emptyForm)
  }

  function abrirNovo() {
    setEditando(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function abrirEdicao(insumo: Insumo) {
    setEditando(insumo)
    setForm({
      nome: insumo.nome,
      categoria: insumo.categoria,
      marca: insumo.marca ?? '',
      unidadeMedida: insumo.unidadeMedida,
      estoqueAtual: String(insumo.estoqueAtual),
      custoMedio: String(insumo.custoMedio),
    })
    setOpen(true)
  }

  const cadastrar = useMutation({
    mutationFn: insumosApi.cadastrar,
    onSuccess: () => {
      toast.success('Material cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['insumos-opcoes'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível cadastrar o material.')),
  })

  const atualizar = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      insumosApi.atualizar(id, {
        nome: form.nome.trim(),
        categoria: form.categoria,
        marca: form.marca.trim() || undefined,
        unidadeMedida: form.unidadeMedida,
        estoqueAtual: form.estoqueAtual !== '' ? Number(form.estoqueAtual) : undefined,
        custoMedio: form.custoMedio !== '' ? Number(form.custoMedio) : undefined,
      }),
    onSuccess: () => {
      toast.success('Material atualizado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['insumos-opcoes'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível atualizar o material.')),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (editando) {
      atualizar.mutate({ id: editando.id })
      return
    }
    cadastrar.mutate({
      nome: form.nome.trim(),
      categoria: form.categoria,
      marca: form.marca.trim() || undefined,
      unidadeMedida: form.unidadeMedida,
    })
  }

  const lista = insumos.data?.conteudo ?? []
  const salvando = cadastrar.isPending || atualizar.isPending

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Matérias-primas e materiais de embalagem."
        actions={
          <Button type="button" onClick={abrirNovo}>
            <Plus className="size-4" />
            Novo material
          </Button>
        }
      />

      {insumos.isLoading ? <LoadingBlock /> : null}
      {!insumos.isLoading && lista.length === 0 ? (
        <EmptyState title="Nenhum material cadastrado" description="Cadastre cera, essência, potes e outros insumos." />
      ) : null}

      {lista.length > 0 ? (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Categoria</Th>
                <Th>Marca</Th>
                <Th>Estoque</Th>
                <Th>Custo médio</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/70">
              {lista.map((insumo) => (
                <tr key={insumo.id}>
                  <Td className="font-medium">{insumo.nome}</Td>
                  <Td>
                    <Badge tone="warn">{categoriaInsumoLabel[insumo.categoria]}</Badge>
                  </Td>
                  <Td>{insumo.marca || '—'}</Td>
                  <Td>
                    {insumo.estoqueAtual} {unidadeLabel[insumo.unidadeMedida]}
                  </Td>
                  <Td>{formatCurrency(insumo.custoMedio)}</Td>
                  <Td>
                    <Button type="button" variant="ghost" onClick={() => abrirEdicao(insumo)}>
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {insumos.data ? (
            <Paginacao meta={insumos.data} onPaginaChange={setPagina} onTamanhoChange={setTamanho} />
          ) : null}
        </>
      ) : null}

      <Modal
        open={open}
        onClose={fecharModal}
        title={editando ? 'Editar material' : 'Novo material'}
      >
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field label="Nome">
            <Input
              required
              value={form.nome}
              onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value }))}
            />
          </Field>
          <Field label="Categoria">
            <Select
              value={form.categoria}
              onChange={(e) => setForm((a) => ({ ...a, categoria: e.target.value as CategoriaInsumo }))}
            >
              {Object.entries(categoriaInsumoLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Marca">
            <Input value={form.marca} onChange={(e) => setForm((a) => ({ ...a, marca: e.target.value }))} />
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
          {editando ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Estoque atual">
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  value={form.estoqueAtual}
                  onChange={(e) => setForm((a) => ({ ...a, estoqueAtual: e.target.value }))}
                />
              </Field>
              <Field label="Custo médio (R$)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.custoMedio}
                  onChange={(e) => setForm((a) => ({ ...a, custoMedio: e.target.value }))}
                />
              </Field>
            </div>
          ) : null}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar material'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}