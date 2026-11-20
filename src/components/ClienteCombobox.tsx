import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { clientesApi } from '@/api/services'
import { Input } from '@/components/ui'
import { normalizarTexto } from '@/lib/normalizarTexto'
import type { Cliente } from '@/types/api'

type Props = {
  value: string
  onSelect: (cliente: Cliente | null) => void
  nomeExibicao?: string
  disabled?: boolean
}

function rotuloSecundario(cliente: Cliente) {
  if (cliente.telefone?.trim()) {
    return cliente.telefone.trim()
  }
  if (cliente.email?.trim()) {
    return cliente.email.trim()
  }
  return 'sem telefone'
}

export function ClienteCombobox({ value, onSelect, nomeExibicao, disabled }: Props) {
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)

  const clientes = useQuery({
    queryKey: ['clientes-busca', termo],
    queryFn: () => clientesApi.opcoes(termo || undefined),
    staleTime: 30_000,
  })

  const selecionado = useMemo(
    () => (clientes.data ?? []).find((c) => c.id === value),
    [clientes.data, value],
  )

  const textoSelecionado = selecionado?.nome ?? nomeExibicao ?? ''

  useEffect(() => {
    if (!aberto && value && textoSelecionado) {
      setTermo(textoSelecionado)
    }
    if (!value) {
      setTermo('')
    }
  }, [value, textoSelecionado, aberto])

  const filtrados = useMemo(() => {
    const lista = clientes.data ?? []
    if (!termo.trim()) return lista
    const n = normalizarTexto(termo)
    return lista.filter((c) => normalizarTexto(c.nome).includes(n))
  }, [clientes.data, termo])

  function limparSelecao() {
    onSelect(null)
    setTermo('')
    setAberto(false)
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Input
        disabled={disabled}
        required={!value}
        className={value && !aberto ? 'pr-9' : undefined}
        placeholder="Buscar cliente por nome…"
        value={aberto ? termo : textoSelecionado}
        onFocus={() => {
          setAberto(true)
          setTermo(textoSelecionado)
        }}
        onChange={(e) => {
          const texto = e.target.value
          setTermo(texto)
          setAberto(true)
          if (!texto.trim() && value) {
            onSelect(null)
          }
        }}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setAberto(false)
            setTermo(textoSelecionado)
          }
        }}
        autoComplete="off"
      />
      {value && !aberto ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-soft hover:bg-paper-deep hover:text-ink"
          title="Limpar cliente"
          onClick={limparSelecao}
        >
          <X className="size-4" />
        </button>
      ) : null}
      {aberto && filtrados.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-line bg-white shadow-lg">
          {filtrados.map((cliente) => (
            <li key={cliente.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-paper-deep/80"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(cliente)
                  setTermo(cliente.nome)
                  setAberto(false)
                }}
              >
                <span className="font-medium">{cliente.nome}</span>
                <span className="ml-2 text-ink-soft">{rotuloSecundario(cliente)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {aberto && termo.trim() && filtrados.length === 0 && !clientes.isLoading ? (
        <p className="absolute z-20 mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink-soft shadow-lg">
          Nenhuma cliente encontrada.
        </p>
      ) : null}
    </div>
  )
}