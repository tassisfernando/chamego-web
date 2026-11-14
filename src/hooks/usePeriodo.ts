import { useMemo, useState } from 'react'
import {
  estadoPeriodoPadrao,
  normalizarMes,
  resolverPeriodo,
  type ModoPeriodo,
  type PeriodoFiltroEstado,
} from '@/lib/periodo'

export function usePeriodo() {
  const [estado, setEstado] = useState<PeriodoFiltroEstado>(estadoPeriodoPadrao)

  const resolvido = useMemo(() => resolverPeriodo(estado), [estado])

  return {
    modo: estado.modo,
    ano: estado.ano,
    mes: estado.mes,
    periodo: {
      inicio: resolvido.inicio,
      fim: resolvido.fim,
    },
    rotuloPeriodo: resolvido.rotulo,
    setModo: (modo: ModoPeriodo) => setEstado((atual) => ({ ...atual, modo })),
    setAno: (ano: number) =>
      setEstado((atual) => ({
        ...atual,
        ano,
        mes: normalizarMes(ano, atual.mes),
      })),
    setMes: (mes: number) =>
      setEstado((atual) => ({
        ...atual,
        mes: normalizarMes(atual.ano, mes),
      })),
    setPeriodo: (ano: number, mes: number) =>
      setEstado((atual) => ({
        ...atual,
        ano,
        mes: normalizarMes(ano, mes),
      })),
  }
}
