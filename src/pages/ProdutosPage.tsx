import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { produtosApi } from '@/api/services'
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
  SearchInput,
  Select,
  TableShell,
  Td,
  Th,
} from '@/components/ui'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePaginacao } from '@/hooks/usePaginacao'
import { categoriaProdutoLabel } from '@/lib/labels'
import { formatCurrency, parseApiError } from '@/lib/utils'
import type { CategoriaProduto, Produto } from '@/types/api'

const emptyForm = {
  nome: '',
  categoria: 'VELA' as CategoriaProduto,
  pesoGramas: '',
  precoVenda: '',
  custoPadrao: '',
  estoqueAtual: '',
}

export function ProdutosPage() {
  const queryClient = useQueryClient()
  const { pagina, tamanho, setPagina, setTamanho } = usePaginacao()
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebouncedValue(busca, 300)
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setPagina(0)
  }, [buscaDebounced, setPagina])

  const produtos = useQuery({
    queryKey: ['produtos', pagina, tamanho, buscaDebounced],
    queryFn: () =>
      produtosApi.listar({ page: pagina, size: tamanho, sort: 'nome', busca: buscaDebounced }),
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

  function abrirEdicao(produto: Produto) {
    setEditando(produto)
    setForm({
      nome: produto.nome,
      categoria: produto.categoria,
      pesoGramas: produto.pesoGramas != null ? String(produto.pesoGramas) : '',
      precoVenda: String(produto.precoVenda),
      custoPadrao: String(produto.custoPadrao),
      estoqueAtual: String(produto.estoqueAtual),
    })
    setOpen(true)
  }

  const cadastrar = useMutation({
    mutationFn: produtosApi.cadastrar,
    onSuccess: () => {
      toast.success('Produto cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['produtos-opcoes'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível cadastrar o produto.')),
  })

  const atualizar = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      produtosApi.atualizar(id, {
        nome: form.nome.trim(),
        categoria: form.categoria,
        pesoGramas: form.pesoGramas ? Number(form.pesoGramas) : undefined,
        precoVenda: form.precoVenda ? Number(form.precoVenda) : undefined,
        custoPadrao: form.custoPadrao ? Number(form.custoPadrao) : undefined,
        estoqueAtual: form.estoqueAtual ? Number(form.estoqueAtual) : undefined,
      }),
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['produtos-opcoes'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível atualizar o produto.')),
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
      pesoGramas: form.pesoGramas ? Number(form.pesoGramas) : undefined,
      precoVenda: form.precoVenda ? Number(form.precoVenda) : undefined,
      custoPadrao: form.custoPadrao ? Number(form.custoPadrao) : undefined,
    })
  }

  const lista = produtos.data?.conteudo ?? []
  const salvando = cadastrar.isPending || atualizar.isPending

  return (
    <div>
      <PageHeader
        title="Velas e kits"
        description="Catálogo dos produtos artesanais com preço e estoque."
        actions={
          <Button type="button" onClick={abrirNovo}>
            <Plus className="size-4" />
            Novo produto
          </Button>
        }
      />

      {produtos.isLoading ? <LoadingBlock /> : null}
      {produtos.isError ? (
        <EmptyState title="Não foi possível carregar os produtos." description="Verifique a conexão com a API." />
      ) : null}

      {!produtos.isLoading && !produtos.isError ? (
        lista.length === 0 && !buscaDebounced.trim() ? (
          <EmptyState title="Nenhum produto cadastrado" description="Cadastre a primeira vela ou kit." />
        ) : (
          <>
            <div className="mb-4 max-w-md">
              <SearchInput
                placeholder="Buscar vela ou kit por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            {lista.length === 0 ? (
              <EmptyState
                title="Nenhum produto encontrado"
                description="Tente outro termo de busca ou cadastre uma nova vela ou kit."
              />
            ) : (
              <>
          <TableShell>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Categoria</Th>
                <Th>Peso</Th>
                <Th>Preço</Th>
                <Th>Custo</Th>
                <Th>Estoque</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/70">
              {lista.map((produto) => (
                <tr key={produto.id}>
                  <Td className="font-medium">{produto.nome}</Td>
                  <Td>
                    <Badge tone="leaf">{categoriaProdutoLabel[produto.categoria]}</Badge>
                  </Td>
                  <Td>{produto.pesoGramas ? `${produto.pesoGramas} g` : '—'}</Td>
                  <Td>{formatCurrency(produto.precoVenda)}</Td>
                  <Td>{formatCurrency(produto.custoPadrao)}</Td>
                  <Td>{produto.estoqueAtual} un</Td>
                  <Td>
                    <Button type="button" variant="ghost" onClick={() => abrirEdicao(produto)}>
                      <Pencil className="size-4" />
                      Editar
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {produtos.data ? (
            <Paginacao meta={produtos.data} onPaginaChange={setPagina} onTamanhoChange={setTamanho} />
          ) : null}
              </>
            )}
          </>
        )
      ) : null}

      <Modal
        open={open}
        onClose={fecharModal}
        title={editando ? 'Editar produto' : 'Novo produto'}
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
              onChange={(e) => setForm((a) => ({ ...a, categoria: e.target.value as CategoriaProduto }))}
            >
              {Object.entries(categoriaProdutoLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <div className={`grid gap-3 ${editando ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
            <Field label="Peso (g)">
              <Input
                type="number"
                min={0}
                value={form.pesoGramas}
                onChange={(e) => setForm((a) => ({ ...a, pesoGramas: e.target.value }))}
              />
            </Field>
            <Field label="Preço de venda">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.precoVenda}
                onChange={(e) => setForm((a) => ({ ...a, precoVenda: e.target.value }))}
              />
            </Field>
            <Field label="Custo padrão">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.custoPadrao}
                onChange={(e) => setForm((a) => ({ ...a, custoPadrao: e.target.value }))}
              />
            </Field>
            {editando ? (
              <Field label="Estoque atual">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={form.estoqueAtual}
                  onChange={(e) => setForm((a) => ({ ...a, estoqueAtual: e.target.value }))}
                />
              </Field>
            ) : null}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar produto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}