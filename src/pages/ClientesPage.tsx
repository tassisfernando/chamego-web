import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Pencil, Plus, UserX } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { clientesApi } from '@/api/services'
import { Paginacao } from '@/components/Paginacao'
import {
  Button,
  EmptyState,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  SearchInput,
  TableShell,
  Td,
  Th,
} from '@/components/ui'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePaginacao } from '@/hooks/usePaginacao'
import { abrirWhatsApp, sanitizarTelefoneBr } from '@/lib/whatsapp'
import { statusCupomLabel } from '@/lib/labels'
import { formatDate, parseApiError } from '@/lib/utils'
import type { Cliente } from '@/types/api'

const emptyForm = {
  nome: '',
  telefone: '',
  cidade: '',
  estado: '',
  dataNascimento: '',
}

export function ClientesPage() {
  const queryClient = useQueryClient()
  const { pagina, tamanho, setPagina, setTamanho } = usePaginacao()
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebouncedValue(busca, 300)
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [confirmacao, setConfirmacao] = useState<Cliente | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setPagina(0)
  }, [buscaDebounced, setPagina])

  const clientes = useQuery({
    queryKey: ['clientes', pagina, tamanho, buscaDebounced],
    queryFn: () =>
      clientesApi.listar({ page: pagina, size: tamanho, sort: 'nome', busca: buscaDebounced }),
  })

  const cadastrar = useMutation({
    mutationFn: clientesApi.cadastrar,
    onSuccess: () => {
      toast.success('Cliente cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] })
      queryClient.invalidateQueries({ queryKey: ['aniversariantes-painel'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível cadastrar o cliente.')),
  })

  const atualizar = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: typeof emptyForm }) =>
      clientesApi.atualizar(id, {
        nome: payload.nome.trim(),
        telefone: payload.telefone.trim() || undefined,
        cidade: payload.cidade.trim() || undefined,
        estado: payload.estado.trim().toUpperCase() || undefined,
        dataNascimento: payload.dataNascimento || undefined,
      }),
    onSuccess: () => {
      toast.success('Cliente atualizado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] })
      queryClient.invalidateQueries({ queryKey: ['aniversariantes-painel'] })
      fecharModal()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível atualizar o cliente.')),
  })

  const desativar = useMutation({
    mutationFn: (id: string) => clientesApi.desativar(id),
    onSuccess: () => {
      toast.success('Cliente desativado.')
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] })
      queryClient.invalidateQueries({ queryKey: ['aniversariantes-painel'] })
      setConfirmacao(null)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível desativar o cliente.')),
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

  function abrirEdicao(cliente: Cliente) {
    setEditando(cliente)
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone ?? '',
      cidade: cliente.cidade ?? '',
      estado: cliente.estado ?? '',
      dataNascimento: cliente.dataNascimento ?? '',
    })
    setOpen(true)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || undefined,
      cidade: form.cidade.trim() || undefined,
      estado: form.estado.trim().toUpperCase() || undefined,
      dataNascimento: form.dataNascimento || undefined,
    }
    if (editando) {
      atualizar.mutate({ id: editando.id, payload: form })
      return
    }
    cadastrar.mutate(payload)
  }

  const lista = clientes.data?.conteudo ?? []
  const salvando = cadastrar.isPending || atualizar.isPending

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro das compradoras, com aniversário para a rotina de cupons."
        actions={
          <Button type="button" onClick={abrirNovo}>
            <Plus className="size-4" />
            Novo cliente
          </Button>
        }
      />

      {clientes.isLoading ? <LoadingBlock /> : null}
      {clientes.isError ? (
        <EmptyState title="Não foi possível carregar os clientes." description="Verifique a conexão com a API." />
      ) : null}

      {!clientes.isLoading && !clientes.isError ? (
        lista.length === 0 && !buscaDebounced.trim() ? (
          <EmptyState title="Nenhum cliente encontrado" description="Cadastre a primeira cliente para começar as vendas." />
        ) : (
          <>
            <div className="mb-4 max-w-md">
              <SearchInput
                placeholder="Buscar por nome ou telefone..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            {lista.length === 0 ? (
              <EmptyState
                title="Nenhum cliente encontrado"
                description="Tente outro termo de busca ou cadastre uma nova cliente."
              />
            ) : (
              <>
                <TableShell>
                  <thead>
                    <tr>
                      <Th>Nome</Th>
                      <Th>Contato</Th>
                      <Th>Cidade / UF</Th>
                      <Th>Aniversário</Th>
                      <Th>Cupom</Th>
                      <Th>Cadastro</Th>
                      <Th>Ações</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-white/70">
                    {lista.map((cliente) => {
                      const temWhatsApp = !!sanitizarTelefoneBr(cliente.telefone)
                      return (
                        <tr key={cliente.id}>
                          <Td className="font-medium">{cliente.nome}</Td>
                          <Td>{cliente.telefone || '—'}</Td>
                          <Td>{[cliente.cidade, cliente.estado].filter(Boolean).join(' / ') || '—'}</Td>
                          <Td>{formatDate(cliente.dataNascimento)}</Td>
                          <Td>{statusCupomLabel[cliente.statusCupom]}</Td>
                          <Td>{formatDate(cliente.dataCadastro)}</Td>
                          <Td>
                            <div className="flex flex-wrap gap-1">
                              <Button type="button" variant="ghost" onClick={() => abrirEdicao(cliente)}>
                                <Pencil className="size-4" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-ok hover:bg-ok/10 hover:text-ok"
                                disabled={!temWhatsApp}
                                title={temWhatsApp ? 'Abrir WhatsApp' : 'Sem telefone válido'}
                                onClick={() => abrirWhatsApp(cliente.telefone)}
                              >
                                <MessageCircle className="size-4" />
                                WhatsApp
                              </Button>
                              <Button type="button" variant="ghost" onClick={() => setConfirmacao(cliente)}>
                                <UserX className="size-4" />
                                Desativar
                              </Button>
                            </div>
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </TableShell>
                {clientes.data ? (
                  <Paginacao
                    meta={clientes.data}
                    onPaginaChange={setPagina}
                    onTamanhoChange={setTamanho}
                  />
                ) : null}
              </>
            )}
          </>
        )
      ) : null}

      <Modal
        open={open}
        onClose={fecharModal}
        title={editando ? 'Editar cliente' : 'Novo cliente'}
        description="Preencha os dados principais. O aniversário ajuda a lembrar do cupom."
      >
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Field label="Nome">
            <Input
              required
              value={form.nome}
              onChange={(e) => setForm((atual) => ({ ...atual, nome: e.target.value }))}
            />
          </Field>
          <Field label="Telefone (WhatsApp)">
            <Input
              value={form.telefone}
              onChange={(e) => setForm((atual) => ({ ...atual, telefone: e.target.value }))}
              placeholder="31999999999"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
            <Field label="Cidade">
              <Input
                value={form.cidade}
                onChange={(e) => setForm((atual) => ({ ...atual, cidade: e.target.value }))}
              />
            </Field>
            <Field label="UF">
              <Input
                maxLength={2}
                value={form.estado}
                onChange={(e) => setForm((atual) => ({ ...atual, estado: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Data de nascimento">
            <Input
              type="date"
              value={form.dataNascimento}
              onChange={(e) => setForm((atual) => ({ ...atual, dataNascimento: e.target.value }))}
            />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar cliente'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmacao}
        onClose={() => setConfirmacao(null)}
        title="Desativar cliente"
        description="A cliente deixa de aparecer nas listagens, mas os pedidos históricos são preservados."
      >
        <p className="text-sm text-ink-soft">
          Confirma desativar <strong>{confirmacao?.nome}</strong>?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirmacao(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={desativar.isPending}
            onClick={() => confirmacao && desativar.mutate(confirmacao.id)}
          >
            {desativar.isPending ? 'Desativando…' : 'Desativar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}