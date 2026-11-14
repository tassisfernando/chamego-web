import { MESES } from '@/lib/labels'
import { anosDisponiveis, mesesDisponiveis, type ModoPeriodo } from '@/lib/periodo'
import { Field, Select } from '@/components/ui'

export function PeriodoFiltro({
  modo,
  ano,
  mes,
  onModoChange,
  onAnoChange,
  onMesChange,
}: {
  modo: ModoPeriodo
  ano: number
  mes: number
  onModoChange: (modo: ModoPeriodo) => void
  onAnoChange: (ano: number) => void
  onMesChange: (mes: number) => void
}) {
  const anos = anosDisponiveis()
  const meses = mesesDisponiveis(ano)

  return (
    <div className="flex flex-wrap gap-3">
      <Field label="Período" className="min-w-44">
        <Select value={modo} onChange={(e) => onModoChange(e.target.value as ModoPeriodo)}>
          <option value="mensal">Mensal</option>
          <option value="anual">Todo o ano</option>
          <option value="todo">Todo o período</option>
        </Select>
      </Field>

      {modo !== 'todo' ? (
        <Field label="Ano" className="min-w-28">
          <Select value={ano} onChange={(e) => onAnoChange(Number(e.target.value))}>
            {anos.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {modo === 'mensal' ? (
        <Field label="Mês" className="min-w-40">
          <Select value={mes} onChange={(e) => onMesChange(Number(e.target.value))}>
            {meses.map((valor) => (
              <option key={valor} value={valor}>
                {MESES[valor - 1]}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
    </div>
  )
}
