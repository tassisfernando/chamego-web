import { insumosApi } from '@/api/services'
import type { LinhaPrecificacaoForm } from '@/lib/precificacaoPayload'

export async function prepararLinhasComCadastroInsumo<T extends LinhaPrecificacaoForm>(
  linhas: T[],
): Promise<T[]> {
  const saida: T[] = []
  for (const linha of linhas) {
    if (linha.cadastrarNoCatalogo && !linha.insumoId && linha.tipo === 'INSUMO') {
      const nome = (linha.nomeMaterial || linha.descricao).trim()
      if (!nome) {
        saida.push(linha)
        continue
      }
      const criado = await insumosApi.cadastrar({
        nome,
        categoria: 'OUTRO',
        unidadeMedida: linha.unidadeMedida ?? 'UN',
      })
      saida.push({
        ...linha,
        insumoId: criado.id,
        nomeMaterial: undefined,
        cadastrarNoCatalogo: false,
        descricao: criado.nome,
      })
    } else {
      saida.push(linha)
    }
  }
  return saida
}