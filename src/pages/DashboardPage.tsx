import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Cake, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { clientesApi, financeiroApi, insumosApi, notificacoesApi, produtosApi } from '@/api/services'
import { PeriodoFiltro } from '@/components/PeriodoFiltro'
import {
  Badge,
  Button,
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
import { abrirWhatsApp, sanitizarTelefoneBr } from '@/lib/whatsapp'
import { formatCurrency, parseApiError } from '@/lib/utils'
import type { AniversarianteResumo } from '@/types/api'

const ESTOQUE_BAIXO_PRODUTO = 5
const ESTOQUE_BAIXO_INSUMO = 20

function formatAniversarioDdMm(dataNascimento: string) {
  const [, month, day] = dataNascimento.split('-')
  if (!month || !day) return '—'
  return `${day}/${month}`
}

function badgeAniversario(item: AniversarianteResumo): { label: string; tone: 'ok' | 'leaf' | 'neutral' } {
  if (item.hoje || item.diasAteAniversario === 0) {
    return { label: 'Hoje!', tone: 'ok' }
  }
  if (item.diasAteAniversario > 0) {
    const dias = item.diasAteAniversario
    return { label: `Em ${dias} dia${dias === 1 ? '' : 's'}`, tone: 'leaf' }
  }
  const dias = Math.abs(item.diasAteAniversario)
  return { label: `Há ${dias} dia${dias === 1 ? '' : 's'}`, tone: 'neutral' }
}

function mensagemAniversario(nome: string) {
  return `Feliz aniversário, ${nome}! 🎂 — com carinho da Chamego`
}

function ListaAniversariantes({
  titulo,
  itens,
  vazio,
}: {
  titulo: string
  itens: AniversarianteResumo[]
  vazio: string
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">{titulo}</h3>
      {!itens.length ? (
        <p className="text-sm text-ink-soft">{vazio}</p>
      ) : (
        <ul className="space-y-2">
          {itens.map((item) => {
            const badge = badgeAniversario(item)
            const temWhatsApp = !!sanitizarTelefoneBr(item.telefone)
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white/70 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.nome}</p>
                  <p className="text-sm text-ink-soft">{formatAniversarioDdMm(item.dataNascimento)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                  {temWhatsApp ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1.5 text-ok hover:bg-ok/10 hover:text-ok"
                      title="Enviar mensagem de aniversário"
                      onClick={() => abrirWhatsApp(item.telefone, mensagemAniversario(item.nome))}
                    >
                      <MessageCircle className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function DashboardPage() {
  const queryClient = useQueryClient()
  const { modo, ano, mes, periodo, rotuloPeriodo, setModo, setAno, setMes } = usePeriodo()

  const financeiro = useQuery({
    queryKey: ['financeiro', periodo],
    queryFn: () => financeiroApi.resultado(periodo),
  })

  const produtos = useQuery({ queryKey: ['produtos-opcoes'], queryFn: () => produtosApi.opcoes() })
  const insumos = useQuery({ queryKey: ['insumos-opcoes'], queryFn: () => insumosApi.opcoes() })
  const painel = useQuery({
    queryKey: ['aniversariantes-painel'],
    queryFn: clientesApi.painelAniversariantes,
  })
  const notificacaoConfig = useQuery({
    queryKey: ['notificacao-aniversario-config'],
    queryFn: notificacoesApi.configuracao,
  })
  const dispararResumo = useMutation({
    mutationFn: notificacoesApi.dispararResumoDiario,
    onSuccess: (resposta) => {
      if (resposta.notificacaoEnviada) {
        toast.success(
          `Resumo enviado para ${resposta.aniversariantes} aniversariante(s) de hoje.`,
        )
      } else {
        toast.message('Nenhum aniversariante hoje — nenhuma notificação foi enviada.')
      }
      queryClient.invalidateQueries({ queryKey: ['notificacao-aniversario-config'] })
    },
    onError: (error) =>
      toast.error(parseApiError(error, 'Não foi possível disparar o lembrete de aniversários.')),
  })

  const produtosBaixos =
    produtos.data?.filter((item) => item.estoqueAtual <= ESTOQUE_BAIXO_PRODUTO) ?? []
  const insumosBaixos =
    insumos.data?.filter((item) => Number(item.estoqueAtual) <= ESTOQUE_BAIXO_INSUMO) ?? []

  const resultado = financeiro.data
  const lucroTone =
    !resultado ? 'neutral' : Number(resultado.resultadoLiquido) >= 0 ? 'ok' : 'danger'

  const proximos = painel.data?.proximos ?? []
  const ultimos = painel.data?.ultimos ?? []
  const semAniversariantes = !painel.isLoading && proximos.length === 0 && ultimos.length === 0

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="Acompanhe receitas, gastos e o resultado do período selecionado."
        actions={
          <PeriodoFiltro
            modo={modo}
            ano={ano}
            mes={mes}
            onModoChange={setModo}
            onAnoChange={setAno}
            onMesChange={setMes}
          />
        }
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
            hint={rotuloPeriodo}
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cake className="size-4 text-ember" />
              <h2 className="font-display text-xl font-semibold">Aniversariantes</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {notificacaoConfig.data ? (
                <Badge tone={notificacaoConfig.data.habilitada ? 'neutral' : 'warn'}>
                  {notificacaoConfig.data.habilitada
                    ? `Canal: ${notificacaoConfig.data.canal}`
                    : 'Lembrete diário desligado'}
                </Badge>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                disabled={
                  dispararResumo.isPending || notificacaoConfig.data?.habilitada === false
                }
                onClick={() => dispararResumo.mutate()}
                title="Envia o resumo diário (e-mail, WhatsApp ou log conforme configuração da API)"
              >
                <Send className="size-4" />
                {dispararResumo.isPending ? 'Enviando…' : 'Testar lembrete diário'}
              </Button>
            </div>
          </div>

          {painel.isLoading ? (
            <LoadingBlock />
          ) : painel.isError ? (
            <EmptyState
              title="Não foi possível carregar aniversários"
              description="Verifique a conexão com a API."
            />
          ) : semAniversariantes ? (
            <EmptyState
              title="Nenhum aniversário próximo"
              description="Quando houver, dá para lembrar do cupom pelo WhatsApp."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <ListaAniversariantes
                titulo="Próximos aniversários"
                itens={proximos}
                vazio="Nenhum aniversário nos próximos dias."
              />
              <ListaAniversariantes
                titulo="Últimos aniversários"
                itens={ultimos}
                vazio="Nenhum aniversário recente."
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}