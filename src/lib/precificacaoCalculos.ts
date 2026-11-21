export function totalCustoLinhas(linhas: { quantidade: number; custoUnitario: number }[]) {
  return linhas.reduce((acc, linha) => acc + linha.quantidade * linha.custoUnitario, 0)
}

export function precoPorMargem(custoTotal: number, margemPercentual: number) {
  const preco = custoTotal * (1 + margemPercentual / 100)
  const lucro = preco - custoTotal
  return { preco: round2(preco), margem: round2(margemPercentual), lucro: round2(lucro), alerta: alertaMargem(margemPercentual) }
}

export function margemPorPreco(custoTotal: number, precoVenda: number) {
  if (custoTotal <= 0) {
    return {
      preco: round2(precoVenda),
      margem: 0,
      lucro: round2(precoVenda),
      alerta: 'CUSTO_ZERO' as const,
    }
  }
  const margem = ((precoVenda - custoTotal) / custoTotal) * 100
  const lucro = precoVenda - custoTotal
  return { preco: round2(precoVenda), margem: round2(margem), lucro: round2(lucro), alerta: alertaMargem(margem) }
}

function alertaMargem(margem: number): 'MARGEM_NEGATIVA' | 'MARGEM_BAIXA' | null {
  if (margem < 0) return 'MARGEM_NEGATIVA'
  if (margem < 30) return 'MARGEM_BAIXA'
  return null
}

function round2(valor: number) {
  return Math.round(valor * 100) / 100
}