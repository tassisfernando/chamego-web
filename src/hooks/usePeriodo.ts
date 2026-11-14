import { useMemo, useState } from 'react'
import { monthBounds } from '@/lib/utils'

export function usePeriodo() {
  const agora = new Date()
  const [ano, setAno] = useState(agora.getFullYear())
  const [mes, setMes] = useState(agora.getMonth() + 1)

  const periodo = useMemo(() => monthBounds(ano, mes), [ano, mes])

  return {
    ano,
    mes,
    periodo,
    setPeriodo: (novoAno: number, novoMes: number) => {
      setAno(novoAno)
      setMes(novoMes)
    },
  }
}
