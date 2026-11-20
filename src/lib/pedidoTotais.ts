export function totalLiquidoItem(
  quantidade: number,
  precoUnitario: number,
  descontoPercentual: number,
): number {
  const bruto = quantidade * precoUnitario
  const desc = Math.min(100, Math.max(0, descontoPercentual || 0))
  return Math.round(bruto * (1 - desc / 100) * 100) / 100
}

export function totaisPedido(
  itens: Array<{ quantidade: number; precoUnitario: number; descontoPercentual: number }>,
  descontoPedidoPercentual: number,
) {
  const subtotal = itens.reduce(
    (acc, item) =>
      acc +
      totalLiquidoItem(item.quantidade, item.precoUnitario, item.descontoPercentual),
    0,
  )
  const descPedido = Math.min(100, Math.max(0, descontoPedidoPercentual || 0))
  const total = Math.round(subtotal * (1 - descPedido / 100) * 100) / 100
  const descontoTotal = Math.round((subtotal - total) * 100) / 100
  return { subtotal, total, descontoTotal }
}