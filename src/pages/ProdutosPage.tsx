import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { produtosApi } from '@/api/services'
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
import { categoriaProdutoLabel } from '@/lib/labels'
import { formatCurrency, parseApiError } from '@/lib/utils'
import type { CategoriaProduto } from '@/types/api'

const emptyForm = {
  nome: '',
  categoria: 'VELA' as CategoriaProduto,
  pesoGramas: '',
  precoVenda: '',
  custoPadrao: '',
}

export function ProdutosPage() {
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const produtos = useQuery({ queryKey: ['produtos'], queryFn: produtosApi.listar })

  const cadastrar = useMutation({
    mutationFn: produtosApi.cadastrar,
    onSuccess: () => {
      toast.success('Produto cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      setForm(emptyForm)
      setOpen(false)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível cadastrar o produto.')),
  })

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (produtos.data ?? []).filter((produto) => {
      if (!termo) return true
      return produto.nome.toLowerCase().includes(termo)
    })
  }, [busca, produtos.data])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    cadastrar.mutate({
      nome: form.nome.trim(),
      categoria: form.categoria,
      pesoGramas: form.pesoGramas ? Number(form.pesoGramas) : undefined,
      precoVenda: form.precoVenda ? Number(form.precoVenda) : 0,
      custoPadrao: form.custoPadrao ? Number(form.custoPadrao) : 0,
    })
  }

  return (
    <div>
      <PageHeader
        title="Velas e kits"
        description="Catálogo de produtos acabados, com preço de venda e estoque atual."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Novo produto
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar vela ou kit…" />
      </div>

      {produtos.isLoading ? <LoadingBlock /> : null}
      {!produtos.isLoading && filtrados.length === 0 ? (
        <EmptyState title="Nenhum produto cadastrado" description="Cadastre as velas e kits que você vende." />
      ) : null}

      {filtrados.length > 0 ? (
        <TableShell>
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th>Categoria</Th>
              <Th>Peso</Th>
              <Th>Preço</Th>
              <Th>Custo</Th>
              <Th>Estoque</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/70">
            {filtrados.map((produto) => (
              <tr key={produto.id}>
                <Td className="font-medium">{produto.nome}</Td>
                <Td>
                  <Badge tone="leaf">{categoriaProdutoLabel[produto.categoria]}</Badge>
                </Td>
                <Td>{produto.pesoGramas ? `${produto.pesoGramas} g` : '—'}</Td>
                <Td>{formatCurrency(produto.precoVenda)}</Td>
                <Td>{formatCurrency(produto.custoPadrao)}</Td>
                <Td>
                  <Badge tone={produto.estoqueAtual <= 5 ? 'warn' : 'ok'}>
                    {produto.estoqueAtual} un
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo produto" description="Cadastre uma vela, kit ou complemento.">
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field label="Nome">
            <Input required value={form.nome} onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value }))} />
          </Field>
          <Field label="Categoria">
            <Select
              value={form.categoria}
              onChange={(e) => setForm((a) => ({ ...a, categoria: e.target.value as CategoriaProduto }))}
            >
              {Object.entries(categoriaProdutoLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Peso (g)">
              <Input
                type="number"
                min={0}
                value={form.pesoGramas}
                onChange={(e) => setForm((a) => ({ ...a, pesoGramas: e.target.value }))}
              />
            </Field>
            <Field label="Preço de venda (R$)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.precoVenda}
                onChange={(e) => setForm((a) => ({ ...a, precoVenda: e.target.value }))}
              />
            </Field>
            <Field label="Custo padrão (R$)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.custoPadrao}
                onChange={(e) => setForm((a) => ({ ...a, custoPadrao: e.target.value }))}
              />
            </Field>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cadastrar.isPending}>
              {cadastrar.isPending ? 'Salvando…' : 'Salvar produto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
