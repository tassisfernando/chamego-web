import { Button, Select } from '@/components/ui'

export type PaginaMeta = {
  pagina: number
  tamanho: number
  totalElementos: number
  totalPaginas: number
}

export function Paginacao({
  meta,
  onPaginaChange,
  onTamanhoChange,
}: {
  meta: PaginaMeta
  onPaginaChange: (pagina: number) => void
  onTamanhoChange: (tamanho: number) => void
}) {
  const { pagina, tamanho, totalElementos, totalPaginas } = meta
  if (totalElementos === 0) return null

  const inicio = pagina * tamanho + 1
  const fim = Math.min((pagina + 1) * tamanho, totalElementos)

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-soft">
        Mostrando {inicio}–{fim} de {totalElementos} registros
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          className="w-auto min-w-28"
          value={tamanho}
          onChange={(e) => onTamanhoChange(Number(e.target.value))}
          aria-label="Itens por página"
        >
          {[10, 20, 50].map((valor) => (
            <option key={valor} value={valor}>
              {valor} por página
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="secondary"
          disabled={pagina <= 0}
          onClick={() => onPaginaChange(pagina - 1)}
        >
          Anterior
        </Button>
        <span className="px-2 text-sm text-ink-soft">
          Página {pagina + 1} de {Math.max(totalPaginas, 1)}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={pagina + 1 >= totalPaginas}
          onClick={() => onPaginaChange(pagina + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  )
}
