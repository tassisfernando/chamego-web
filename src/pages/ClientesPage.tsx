import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { clientesApi } from '@/api/services'
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
import { statusCupomLabel } from '@/lib/labels'
import { formatDate, parseApiError } from '@/lib/utils'

const emptyForm = {
  nome: '',
  telefone: '',
  cidade: '',
  estado: '',
  dataNascimento: '',
}

export function ClientesPage() {
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const clientes = useQuery({ queryKey: ['clientes'], queryFn: clientesApi.listar })

  const cadastrar = useMutation({
    mutationFn: clientesApi.cadastrar,
    onSuccess: () => {
      toast.success('Cliente cadastrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['aniversariantes'] })
      setForm(emptyForm)
      setOpen(false)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível cadastrar o cliente.')),
  })

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (clientes.data ?? []).filter((cliente) => {
      if (!termo) return true
      return [cliente.nome, cliente.telefone, cliente.cidade, cliente.estado]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo))
    })
  }, [busca, clientes.data])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    cadastrar.mutate({
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || undefined,
      cidade: form.cidade.trim() || undefined,
      estado: form.estado.trim().toUpperCase() || undefined,
      dataNascimento: form.dataNascimento || undefined,
    })
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro das compradoras, com aniversário para a rotina de cupons."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Novo cliente
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, telefone ou cidade…" />
      </div>

      {clientes.isLoading ? <LoadingBlock /> : null}
      {clientes.isError ? (
        <EmptyState title="Não foi possível carregar os clientes." description="Verifique a conexão com a API." />
      ) : null}

      {!clientes.isLoading && !clientes.isError ? (
        filtrados.length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado" description="Cadastre a primeira cliente para começar as vendas." />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Contato</Th>
                <Th>Cidade / UF</Th>
                <Th>Aniversário</Th>
                <Th>Cupom</Th>
                <Th>Cadastro</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/70">
              {filtrados.map((cliente) => (
                <tr key={cliente.id}>
                  <Td className="font-medium">{cliente.nome}</Td>
                  <Td>{cliente.telefone || '—'}</Td>
                  <Td>
                    {[cliente.cidade, cliente.estado].filter(Boolean).join(' / ') || '—'}
                  </Td>
                  <Td>{formatDate(cliente.dataNascimento)}</Td>
                  <Td>{statusCupomLabel[cliente.statusCupom]}</Td>
                  <Td>{formatDate(cliente.dataCadastro)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo cliente"
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
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cadastrar.isPending}>
              {cadastrar.isPending ? 'Salvando…' : 'Salvar cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
