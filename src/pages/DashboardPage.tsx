import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Cake } from 'lucide-react'
import { clientesApi, financeiroApi, insumosApi, produtosApi } from '@/api/services'
import { PeriodoFiltro } from '@/components/PeriodoFiltro'
import {
  Badge,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  StatCard,
  TableShell,
  Td,
  Th,
} from '@/components/ui'
import { usePeriodo } from '@/hooks/usePeriodo'
import { MESES } from '@/lib/labels'
import { formatCurrency } from '@/lib/utils'

const ESTOQUE_BAIXO_PRODUTO = 5
const ESTOQUE_BAIXO_INSUMO = 20

export function DashboardPage() {
  const { ano, mes, periodo, setPeriodo } = usePeriodo()

  const financeiro = useQuery({
    queryKey: ['financeiro', periodo],
    queryFn: () => financeiroApi.resultado(periodo),
  })

  const produtos = useQuery({ queryKey: ['produtos'], queryFn: produtosApi.listar })
  const insumos = useQuery({ queryKey: ['insumos'], queryFn: insumosApi.listar })
  const aniversariantes = useQuery({
    queryKey: ['aniversariantes'],
    queryFn: clientesApi.aniversariantes,
  })

  const produtosBaixos =
    produtos.data?.filter((item) => item.estoqueAtual <= ESTOQUE_BAIXO_PRODUTO) ?? []
  const insumosBaixos =
    insumos.data?.filter((item) => Number(item.estoqueAtual) <= ESTOQUE_BAIXO_INSUMO) ?? []

  const resultado = financeiro.data
  const lucroTone =
    !resultado ? 'neutral' : Number(resultado.resultadoLiquido) >= 0 ? 'ok' : 'danger'

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="Acompanhe receitas, gastos e o resultado do mês — no mesmo espírito da planilha financeira."
        actions={<PeriodoFiltro ano={ano} mes={mes} onChange={setPeriodo} />}
      />

      {financeiro.isLoading ? <LoadingBlock label="Calculando resultado do período…" /> : null}
      {financeiro.isError ? (
        <Card className="mb-6 border-danger/30 text-danger">
          Não foi possível carregar o resultado financeiro. Confira se a API está ligada.
        </Card>
      ) : null}

      {resultado ? (
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Receitas (vendas)"
            value={formatCurrency(resultado.receitaVendas)}
            hint={`${MESES[mes - 1]} / ${ano}`}
            tone="leaf"
          />
          <StatCard
            label="Gastos do período"
            value={formatCurrency(resultado.totalDespesas)}
            hint="Compras e despesas registradas"
            tone="warn"
          />
          <StatCard
            label="Lucro bruto"
            value={formatCurrency(resultado.lucroBruto)}
            hint="Receitas menos custo das velas vendidas"
            tone="neutral"
          />
          <StatCard
            label={Number(resultado.resultadoLiquido) >= 0 ? 'Lucro líquido' : 'Prejuízo'}
            value={formatCurrency(resultado.resultadoLiquido)}
            hint="Receitas − custos − gastos"
            tone={lucroTone}
          />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="size-4 text-warn" />
            <h2 className="font-display text-xl font-semibold">Alertas de estoque</h2>
          </div>

          {produtos.isLoading || insumos.isLoading ? (
            <LoadingBlock label="Verificando estoque…" />
          ) : produtosBaixos.length === 0 && insumosBaixos.length === 0 ? (
            <EmptyState
              title="Estoque em dia"
              description="Nenhuma vela ou material abaixo do limite de atenção."
            />
          ) : (
            <TableShell>
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th>Tipo</Th>
                  <Th>Saldo</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white/60">
                {produtosBaixos.map((item) => (
                  <tr key={`p-${item.id}`}>
                    <Td>{item.nome}</Td>
                    <Td>
                      <Badge tone="leaf">Vela / kit</Badge>
                    </Td>
                    <Td>{item.estoqueAtual} un</Td>
                  </tr>
                ))}
                {insumosBaixos.map((item) => (
                  <tr key={`i-${item.id}`}>
                    <Td>
                      {item.nome}
                      {item.marca ? ` · ${item.marca}` : ''}
                    </Td>
                    <Td>
                      <Badge tone="warn">Material</Badge>
                    </Td>
                    <Td>
                      {item.estoqueAtual} {item.unidadeMedida.toLowerCase()}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Cake className="size-4 text-ember" />
            <h2 className="font-display text-xl font-semibold">Aniversariantes de hoje</h2>
          </div>

          {aniversariantes.isLoading ? (
            <LoadingBlock />
          ) : !aniversariantes.data?.length ? (
            <EmptyState
              title="Nenhum aniversário hoje"
              description="Quando houver, dá para lembrar do cupom pelo WhatsApp."
            />
          ) : (
            <ul className="space-y-3">
              {aniversariantes.data.map((cliente) => (
                <li
                  key={cliente.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-white/70 px-3 py-3"
                >
                  <div>
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-ink-soft">{cliente.telefone || 'Sem telefone'}</p>
                  </div>
                  <Badge tone="ok">Hoje</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
