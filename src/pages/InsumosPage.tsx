import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { insumosApi } from '@/api/services'
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
  Th,
} from '@/components/ui'
import { categoriaInsumoLabel, unidadeLabel } from '@/lib/labels'
import { formatCurrency, parseApiError } from '@/lib/utils'
import type { CategoriaInsumo, UnidadeMedida } from '@/types/api'

const emptyForm = {
  nome: '',
  categoria: 'ESSENCIA' as CategoriaInsumo,
  marca: '',
  unidadeMedida: 'ML' as UnidadeMedida,
}

export function InsumosPage() {
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string>('TODAS')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const insumos = useQuery({ queryKey: ['insumos'], queryFn: insumosApi.listar })

  const cadastrar = useMutation({
    mutationFn: insumosApi.cadastrar,
    onSuccess: () => {
      toast.success('Material cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      setForm(emptyForm)
      setOpen(false)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível cadastrar o material.')),
  })

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (insumos.data ?? []).filter((insumo) => {
      if (categoria !== 'TODAS' && insumo.categoria !== categoria) return false
      if (!termo) return true
      return [insumo.nome, insumo.marca]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo))
    })
  }, [busca, categoria, insumos.data])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    cadastrar.mutate({
      nome: form.nome.trim(),
      categoria: form.categoria,
      marca: form.marca.trim() || undefined,
      unidadeMedida: form.unidadeMedida,
    })
  }

  return (
    <div>
      <PageHeader
        title="Estoque de materiais"
        description="Essências, ceras, potes, pavios e embalagens — no estilo da aba ESTOQUE da planilha."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Novo material
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <SearchInput
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou marca…"
        />
        <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="TODAS">Todas as categorias</option>
          {Object.entries(categoriaInsumoLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {insumos.isLoading ? <LoadingBlock /> : null}
      {!insumos.isLoading && filtrados.length === 0 ? (
        <EmptyState title="Nenhum material encontrado" description="Cadastre os insumos para controlar o estoque." />
      ) : null}

      {filtrados.length > 0 ? (
        <TableShell>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th>Categoria</Th>
              <Th>Marca</Th>
              <Th>Unidade</Th>
              <Th>Estoque</Th>
              <Th>Custo médio</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/70">
            {filtrados.map((insumo) => (
              <tr key={insumo.id}>
                <Td className="font-medium">{insumo.nome}</Td>
                <Td>{categoriaInsumoLabel[insumo.categoria]}</Td>
                <Td>{insumo.marca || '—'}</Td>
                <Td>{unidadeLabel[insumo.unidadeMedida]}</Td>
                <Td>
                  <Badge tone={Number(insumo.estoqueAtual) <= 20 ? 'warn' : 'ok'}>
                    {insumo.estoqueAtual} {insumo.unidadeMedida.toLowerCase()}
                  </Badge>
                </Td>
                <Td>{formatCurrency(insumo.custoMedio)}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo material" description="Cadastre um item de estoque. As entradas entram pelos gastos.">
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field label="Nome">
            <Input required value={form.nome} onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value }))} />
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
          <Field label="Unidade de medida">
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
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cadastrar.isPending}>
              {cadastrar.isPending ? 'Salvando…' : 'Salvar material'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
