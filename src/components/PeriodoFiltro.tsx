import { MESES } from '@/lib/labels'
import { Field, Select } from '@/components/ui'

export function PeriodoFiltro({
  ano,
  mes,
  onChange,
}: {
  ano: number
  mes: number
  onChange: (ano: number, mes: number) => void
}) {
  const anos = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="flex flex-wrap gap-3">
      <Field label="Mês" className="min-w-40">
        <Select value={mes} onChange={(e) => onChange(ano, Number(e.target.value))}>
          {MESES.map((nome, index) => (
            <option key={nome} value={index + 1}>
              {nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Ano" className="min-w-28">
        <Select value={ano} onChange={(e) => onChange(Number(e.target.value), mes)}>
          {anos.map((valor) => (
            <option key={valor} value={valor}>
              {valor}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  )
}
