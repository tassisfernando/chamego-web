import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { clientesApi } from '@/api/services'
import { Button, Field, Input, Modal, Textarea } from '@/components/ui'
import { parseApiError } from '@/lib/utils'
import type { Cliente } from '@/types/api'

const emptyForm = {
  nome: '',
  telefone: '',
  dataNascimento: '',
  email: '',
  observacao: '',
}

type Props = {
  open: boolean
  onClose: () => void
  onClienteCriado: (cliente: Cliente) => void
}

export function QuickClienteCadastroModal({ open, onClose, onClienteCriado }: Props) {
  const [form, setForm] = useState(emptyForm)

  const cadastrar = useMutation({
    mutationFn: clientesApi.cadastrar,
    onSuccess: (cliente) => {
      toast.success('Cliente cadastrado e selecionado!')
      setForm(emptyForm)
      onClienteCriado(cliente)
      onClose()
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível cadastrar o cliente.')),
  })

  function fechar() {
    if (cadastrar.isPending) return
    setForm(emptyForm)
    onClose()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form.nome.trim()) {
      toast.error('Informe o nome da cliente.')
      return
    }
    cadastrar.mutate({
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || undefined,
      dataNascimento: form.dataNascimento || undefined,
      email: form.email.trim() || undefined,
      observacao: form.observacao.trim() || undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={fechar}
      title="Novo cliente"
      description="Cadastro rápido sem sair do pedido. Os itens já preenchidos são mantidos."
    >
      <form className="grid gap-3" onSubmit={onSubmit}>
        <Field label="Nome">
          <Input
            required
            autoFocus
            value={form.nome}
            onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value }))}
            placeholder="Nome completo"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="WhatsApp / telefone">
            <Input
              value={form.telefone}
              onChange={(e) => setForm((a) => ({ ...a, telefone: e.target.value }))}
              placeholder="(31) 99999-9999"
            />
          </Field>
          <Field label="Data de nascimento">
            <Input
              type="date"
              value={form.dataNascimento}
              onChange={(e) => setForm((a) => ({ ...a, dataNascimento: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="E-mail">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((a) => ({ ...a, email: e.target.value }))}
            placeholder="opcional"
          />
        </Field>
        <Field label="Observações / preferências">
          <Textarea
            value={form.observacao}
            onChange={(e) => setForm((a) => ({ ...a, observacao: e.target.value }))}
            placeholder="Aromas favoritos, alergias, forma de contato…"
          />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={fechar} disabled={cadastrar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={cadastrar.isPending}>
            {cadastrar.isPending ? 'Salvando…' : 'Salvar cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}