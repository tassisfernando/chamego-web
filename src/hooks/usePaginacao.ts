import { useState } from 'react'

export function usePaginacao(tamanhoInicial = 20) {
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(tamanhoInicial)

  return {
    pagina,
    tamanho,
    setPagina,
    setTamanho: (novo: number) => {
      setTamanho(novo)
      setPagina(0)
    },
    resetar: () => setPagina(0),
  }
}
