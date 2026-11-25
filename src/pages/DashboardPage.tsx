import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Cake, ChevronRight, MessageCircle, Package, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { clientesApi, financeiroApi, insumosApi, notificacoesApi, pedidosApi, produtosApi } from '@/api/services'
import { PeriodoFiltro } from '@/components/PeriodoFiltro'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  StatCard,
} from '@/components/ui'
import { usePeriodo } from '@/hooks/usePeriodo'
import { abrirWhatsApp, sanitizarTelefoneBr } from '@/lib/whatsapp'
import { formatCurrency, formatDate, parseApiError } from '@/lib/utils'
import type { AniversarianteResumo, EntregaAgendada, Insumo, Produto } from '@/types/api'
import { statusPedidoLabel } from '@/lib/labels'

const ESTOQUE_BAIXO_PRODUTO = 5
const ESTOQUE_BAIXO_INSUMO = 20
const ALERTAS_ESTOQUE_INICIAL = 5

type AlertaEstoqueItem = {
  id: string
  nome: string
  tipo: 'produto' | 'insumo'
  saldo: number
  limite: number
  unidade: string
  href: string
}

function montarAlertasEstoque(produtos: Produto[], insumos: Insumo[]): AlertaEstoqueItem[] {
  const deProdutos: AlertaEstoqueItem[] = produtos
    .filter((item) => item.estoqueAtual <= ESTOQUE_BAIXO_PRODUTO)
    .map((item) => ({
      id: item.id,
      nome: item.nome,
      tipo: 'produto',
      saldo: item.estoqueAtual,
      limite: ESTOQUE_BAIXO_PRODUTO,
      unidade: 'un',
      href: '/produtos',
    }))
  const deInsumos: AlertaEstoqueItem[] = insumos
    .filter((item) => Number(item.estoqueAtual) <= ESTOQUE_BAIXO_INSUMO)
    .map((item) => ({
      id: item.id,
      nome: item.marca ? `${item.nome} · ${item.marca}` : item.nome,
      tipo: 'insumo',
      saldo: Number(item.estoqueAtual),
      limite: ESTOQUE_BAIXO_INSUMO,
      unidade: item.unidadeMedida.toLowerCase(),
      href: '/insumos',
    }))
  return [...deProdutos, ...deInsumos].sort((a, b) => a.saldo / a.limite - b.saldo / b.limite)
}

function AlertasEstoqueCompacto({
  carregando,
  alertas,
}: {
  carregando: boolean
  alertas: AlertaEstoqueItem[]
}) {
  const [expandido, setExpandido] = useState(false)
  const total = alertas.length
  const exibir = expandido ? alertas : alertas.slice(0, ALERTAS_ESTOQUE_INICIAL)
  const restantes = Math.max(0, total - ALERTAS_ESTOQUE_INICIAL)

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-warn" />
          <h2 className="font-display text-xl font-semibold">Alertas de estoque</h2>
          {total > 0 ? (
            <Badge tone="warn">
              {total} {total === 1 ? 'item' : 'itens'}
            </Badge>
          ) : null}
        </div>
        {total > ALERTAS_ESTOQUE_INICIAL ? (
          <Button type="button" variant="ghost" className="text-sm" onClick={() => setExpandido((v) => !v)}>
            {expandido ? 'Mostrar menos' : `Ver todos (${total})`}
          </Button>
        ) : null}
      </div>

      {carregando ? (
        <LoadingBlock label="Verificando estoque…" />
      ) : total === 0 ? (
        <EmptyState
          title="Estoque em dia"
          description="Nenhuma vela ou material abaixo do limite de atenção."
        />
      ) : (
        <ul
          className={`divide-y divide-line rounded-xl border border-line bg-white/60 ${
            expandido ? 'max-h-64 overflow-y-auto' : ''
          }`}
        >
          {exibir.map((item) => (
            <li
              key={`${item.tipo}-${item.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0">
                  <Badge tone={item.tipo === 'produto' ? 'leaf' : 'warn'}>
                    {item.tipo === 'produto' ? 'Vela' : 'Material'}
                  </Badge>
                </span>
                <span className="truncate font-medium">{item.nome}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-ink-soft">
                  {item.saldo} / {item.limite} {item.unidade}
                </span>
                <Link
                  to={item.href}
                  className="inline-flex items-center gap-0.5 font-medium text-leaf hover:underline"
                  title={item.tipo === 'produto' ? 'Abrir catálogo de produtos' : 'Abrir materiais para repor'}
                >
                  Repor
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!carregando && total > 0 && !expandido && restantes > 0 ? (
        <p className="mt-2 text-xs text-ink-soft">
          Exibindo os {ALERTAS_ESTOQUE_INICIAL} itens mais críticos. Use &quot;Ver todos&quot; para ver a lista
          completa.
        </p>
      ) : null}
    </Card>
  )
}

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

function mensagemEntrega(item: EntregaAgendada) {
  return `Oi, ${item.clienteNome}! Aqui é a Chamego 🕯️ Passando para confirmar a entrega do seu pedido (${item.resumoItens}) marcada para ${formatDate(item.dataEntrega)}.`
}

function tomEntrega(status: EntregaAgendada['status']): 'ok' | 'warn' | 'neutral' | 'danger' {
  if (status === 'CONFIRMADO') return 'ok'
  if (status === 'ORCAMENTO') return 'warn'
  if (status === 'CANCELADO') return 'danger'
  return 'neutral'
}

function ListaEntregas({
  titulo,
  itens,
  vazio,
}: {
  titulo: string
  itens: EntregaAgendada[]
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
            const temWhatsApp = !!sanitizarTelefoneBr(item.clienteTelefone)
            const hoje = item.hoje || item.diasAteEntrega === 0
            return (
              <li
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                  hoje ? 'border-ok/40 bg-ok/10' : 'border-line bg-white/70'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.clienteNome}</p>
                  <p className="text-sm text-ink-soft">
                    {formatDate(item.dataEntrega)} · {item.resumoItens} · {formatCurrency(item.valorTotal)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={hoje ? 'ok' : 'leaf'}>{hoje ? 'Hoje' : `Em ${item.diasAteEntrega} dia${item.diasAteEntrega === 1 ? '' : 's'}`}</Badge>
                  <Badge tone={tomEntrega(item.status)}>{statusPedidoLabel[item.status]}</Badge>
                  {temWhatsApp ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1.5 text-ok hover:bg-ok/10 hover:text-ok"
                      title="Falar sobre a entrega no WhatsApp"
                      onClick={() => abrirWhatsApp(item.clienteTelefone, mensagemEntrega(item))}
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
  const entregas = useQuery({
    queryKey: ['entregas-painel'],
    queryFn: () => pedidosApi.painelEntregas(7),
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
  const dispararDigest = useMutation({
    mutationFn: notificacoesApi.dispararDigestProprietaria,
    onSuccess: (resposta) => {
      if (!resposta.notificacaoEnviada) {
        toast.message('Nenhum aniversário nem entrega hoje — nenhuma mensagem foi enviada.')
        return
      }
      const destino = resposta.entreguePelaApi ? 'WhatsApp da Maressa' : 'log da API (WhatsApp ainda não configurado)'
      toast.success(
        `Resumo de hoje enviado (${resposta.aniversariantes} aniversário(s), ${resposta.entregas} entrega(s)) via ${destino}.`,
      )
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível enviar o resumo diário.')),
  })

  const alertasEstoque = useMemo(
    () => montarAlertasEstoque(produtos.data ?? [], insumos.data ?? []),
    [produtos.data, insumos.data],
  )

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

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-leaf" />
              <h2 className="font-display text-xl font-semibold">Entregas de hoje e próximas</h2>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={dispararDigest.isPending}
              onClick={() => dispararDigest.mutate()}
              title="Dispara o resumo das 7h (aniversários e entregas de hoje) para o WhatsApp da Maressa"
            >
              <Send className="size-4" />
              {dispararDigest.isPending ? 'Enviando…' : 'Testar resumo das 7h'}
            </Button>
          </div>

          {entregas.isLoading ? (
            <LoadingBlock />
          ) : entregas.isError ? (
            <EmptyState
              title="Não foi possível carregar as entregas"
              description="Verifique a conexão com a API."
            />
          ) : (entregas.data?.hoje.length ?? 0) === 0 && (entregas.data?.proximas.length ?? 0) === 0 ? (
            <EmptyState
              title="Nenhuma entrega na agenda"
              description="Quando um pedido tiver data de entrega, ele aparece aqui — hoje no topo e os próximos 7 dias ao lado."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <ListaEntregas
                titulo="Hoje"
                itens={entregas.data?.hoje ?? []}
                vazio="Nenhuma entrega marcada para hoje."
              />
              <ListaEntregas
                titulo="Próximos dias"
                itens={entregas.data?.proximas ?? []}
                vazio="Nenhuma entrega nos próximos 7 dias."
              />
            </div>
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

      <AlertasEstoqueCompacto
        carregando={produtos.isLoading || insumos.isLoading}
        alertas={alertasEstoque}
      />
    </div>
  )
}