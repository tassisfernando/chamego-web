import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Copy, Package, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { insumosApi, precificacoesApi, produtosApi } from '@/api/services'
import { InsumoCombobox } from '@/components/InsumoCombobox'
import { PrecificacaoTabelaItens } from '@/components/PrecificacaoTabelaItens'
import { Paginacao } from '@/components/Paginacao'
import { ProductCombobox } from '@/components/ProductCombobox'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingBlock,
  PageHeader,
  TableShell,
  Td,
  Textarea,
  Th,
} from '@/components/ui'
import { usePaginacao } from '@/hooks/usePaginacao'
import { usePrecificacaoSimulacao } from '@/hooks/usePrecificacaoSimulacao'
import { margemPorPreco, precoPorMargem } from '@/lib/precificacaoCalculos'
import { prepararLinhasComCadastroInsumo } from '@/lib/prepararInsumosPrecificacao'
import {
  itemApiParaLinha,
  linhaPrecificacaoVazia,
  montarPayloadSalvar,
  totalCustoFormulario,
  type LinhaPrecificacaoForm,
} from '@/lib/precificacaoPayload'
import { formatCurrency, parseApiError } from '@/lib/utils'
import type {
  ItemPrecificacao,
  Precificacao,
  SimulacaoPrecificacao,
  TipoItemPrecificacao,
  TipoPrecificacao,
} from '@/types/api'

type ModoAba = TipoPrecificacao

type LinhaLocal = LinhaPrecificacaoForm & { key: string }

function novaLinha(tipo: TipoItemPrecificacao = 'INSUMO'): LinhaLocal {
  return { key: crypto.randomUUID(), ...linhaPrecificacaoVazia(tipo) }
}

function alertaLabel(alerta?: string | null) {
  if (alerta === 'MARGEM_NEGATIVA') return { text: 'Margem negativa — prejuízo', tone: 'danger' as const }
  if (alerta === 'MARGEM_BAIXA') return { text: 'Margem abaixo de 30%', tone: 'warn' as const }
  if (alerta === 'CUSTO_ZERO') return { text: 'Custo zero — revise os itens', tone: 'warn' as const }
  return null
}

export function PrecificacaoPage() {
  const queryClient = useQueryClient()
  const { pagina, tamanho, setPagina, setTamanho } = usePaginacao()
  const [aba, setAba] = useState<ModoAba>('VELA_INDIVIDUAL')
  const [titulo, setTitulo] = useState('')
  const [produtoReferenciaId, setProdutoReferenciaId] = useState('')
  const [linhas, setLinhas] = useState<LinhaLocal[]>([novaLinha()])
  const [margemPercentual, setMargemPercentual] = useState('100')
  const [precoVenda, setPrecoVenda] = useState('')
  const [modoPreco, setModoPreco] = useState<'margem' | 'preco'>('margem')
  const [observacao, setObservacao] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const produtos = useQuery({ queryKey: ['produtos-opcoes'], queryFn: () => produtosApi.opcoes() })
  const insumos = useQuery({ queryKey: ['insumos-opcoes'], queryFn: () => insumosApi.opcoes() })
  const salvos = useQuery({
    queryKey: ['precificacoes', pagina, tamanho],
    queryFn: () => precificacoesApi.listar({ page: pagina, size: tamanho }),
  })

  const entradaSimulacao = useMemo(
    () => ({
      tipo: aba,
      linhas,
      margemPercentual,
      precoVenda,
      modoPreco,
    }),
    [aba, linhas, margemPercentual, precoVenda, modoPreco],
  )

  const sincronizarDerivado = useCallback((sim: SimulacaoPrecificacao, modo: 'margem' | 'preco') => {
    if (modo === 'margem') {
      setPrecoVenda(String(sim.precoVenda))
    } else {
      setMargemPercentual(String(sim.margemPercentual))
    }
  }, [])

  const { simulacao, simulando, erro: erroSimulacao } = usePrecificacaoSimulacao(entradaSimulacao, {
    onSincronizarDerivado: sincronizarDerivado,
  })

  const custoLocal = useMemo(() => totalCustoFormulario(linhas), [linhas])
  const resumoLocal = useMemo(() => {
    if (modoPreco === 'preco' && precoVenda) {
      return margemPorPreco(custoLocal, Number(precoVenda) || 0)
    }
    return precoPorMargem(custoLocal, Number(margemPercentual) || 0)
  }, [custoLocal, margemPercentual, precoVenda, modoPreco])

  const custoTotal = simulacao?.custoTotal ?? custoLocal
  const resumo = simulacao
    ? {
        preco: simulacao.precoVenda,
        margem: simulacao.margemPercentual,
        lucro: simulacao.lucroUnitario,
        alerta: simulacao.alerta ?? null,
      }
    : resumoLocal

  function aoSelecionarMargem(valor: string) {
    setModoPreco('margem')
    setMargemPercentual(valor)
    const calc = precoPorMargem(custoLocal, Number(valor) || 0)
    setPrecoVenda(String(calc.preco))
  }

  function aoSelecionarPreco(valor: string) {
    setModoPreco('preco')
    setPrecoVenda(valor)
    const calc = margemPorPreco(custoLocal, Number(valor) || 0)
    setMargemPercentual(String(calc.margem))
  }

  async function carregarFichaVela(produtoId: string) {
    try {
      const ficha = await precificacoesApi.fichaProduto(produtoId)
      if (!ficha.length) {
        toast.message('Esta vela ainda não tem ficha técnica cadastrada.')
        return
      }
      setLinhas(
        ficha.map((item) => ({
          key: crypto.randomUUID(),
          ...itemApiParaLinha({ ...item, tipo: 'INSUMO' }),
          insumoId: item.insumoId ?? undefined,
        })),
      )
    } catch (error) {
      toast.error(parseApiError(error, 'Não foi possível carregar a ficha técnica.'))
    }
  }

  function adicionarProdutoKit(produtoId: string) {
    const produto = produtos.data?.find((p) => p.id === produtoId)
    if (!produto) return
    setLinhas((lista) => [
      ...lista,
      {
        key: crypto.randomUUID(),
        ...linhaPrecificacaoVazia('PRODUTO'),
        produtoId,
        descricao: produto.nome,
        quantidade: '1',
        custoUnitario: String(produto.custoPadrao),
      },
    ])
  }

  function adicionarInsumo(insumoId: string) {
    const insumo = insumos.data?.find((i) => i.id === insumoId)
    if (!insumo) return
    setLinhas((lista) => [
      ...lista,
      {
        key: crypto.randomUUID(),
        ...linhaPrecificacaoVazia('INSUMO'),
        insumoId,
        nomeMaterial: undefined,
        cadastrarNoCatalogo: false,
        descricao: insumo.nome,
        quantidade: '1',
        unidadeMedida: insumo.unidadeMedida,
        unidadeEmbalagem: insumo.unidadeMedida,
        custoUnitario: String(insumo.custoMedio),
        valorEmbalagem: String(insumo.custoMedio),
        quantidadeEmbalagem: '1',
      },
    ])
  }

  function adicionarExtra() {
    setLinhas((lista) => [...lista, { ...novaLinha('EXTRA'), descricao: 'Item extra' }])
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const linhasProntas = await prepararLinhasComCadastroInsumo(linhas)
      const payload = montarPayloadSalvar(
        titulo,
        aba,
        produtoReferenciaId,
        linhasProntas,
        margemPercentual,
        precoVenda,
        observacao,
        modoPreco,
      )
      if (editandoId) {
        return precificacoesApi.atualizar(editandoId, payload)
      }
      return precificacoesApi.salvar(payload)
    },
    onSuccess: () => {
      toast.success('Precificação salva.')
      queryClient.invalidateQueries({ queryKey: ['precificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos-opcoes'] })
      queryClient.invalidateQueries({ queryKey: ['insumos-opcoes'] })
      setEditandoId(null)
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível salvar.')),
  })

  const excluir = useMutation({
    mutationFn: precificacoesApi.excluir,
    onSuccess: () => {
      toast.success('Precificação excluída.')
      queryClient.invalidateQueries({ queryKey: ['precificacoes'] })
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível excluir.')),
  })

  const aplicarPreco = useMutation({
    mutationFn: ({ id, produtoId }: { id: string; produtoId?: string }) =>
      precificacoesApi.aplicarPreco(id, produtoId),
    onSuccess: () => {
      toast.success('Preço aplicado ao catálogo.')
      queryClient.invalidateQueries({ queryKey: ['produtos-opcoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível aplicar o preço.')),
  })

  const publicarKit = useMutation({
    mutationFn: (id: string) => precificacoesApi.publicarKit(id, titulo.trim() || undefined),
    onSuccess: () => {
      toast.success('Kit publicado como produto KIT.')
      queryClient.invalidateQueries({ queryKey: ['precificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos-opcoes'] })
    },
    onError: (error) => toast.error(parseApiError(error, 'Não foi possível publicar o kit.')),
  })

  async function carregarSalvo(item: Precificacao) {
    const detalhe = item.itens?.length ? item : await precificacoesApi.buscar(item.id)
    setEditandoId(detalhe.id)
    setAba(detalhe.tipo)
    setTitulo(detalhe.titulo)
    setProdutoReferenciaId(detalhe.produtoReferenciaId ?? '')
    setMargemPercentual(String(detalhe.margemPercentual))
    setPrecoVenda(String(detalhe.precoVenda))
    setObservacao(detalhe.observacao ?? '')
    setModoPreco('preco')
    setLinhas(
      (detalhe.itens ?? []).map((l: ItemPrecificacao) => ({
        key: l.id ?? crypto.randomUUID(),
        ...itemApiParaLinha(l),
      })),
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function limparFormulario() {
    setEditandoId(null)
    setTitulo('')
    setProdutoReferenciaId('')
    setLinhas(aba === 'KIT' ? [] : [novaLinha()])
    setMargemPercentual('100')
    setPrecoVenda('')
    setObservacao('')
  }

  const alerta = alertaLabel(resumo.alerta)
  const lista = salvos.data?.conteudo ?? []

  return (
    <div>
      <PageHeader
        title="Precificação"
        description="Simule custos de velas e kits, defina margem ou preço de venda e aplique no catálogo."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" variant={aba === 'VELA_INDIVIDUAL' ? 'primary' : 'secondary'} onClick={() => { setAba('VELA_INDIVIDUAL'); limparFormulario() }}>
          Vela individual
        </Button>
        <Button type="button" variant={aba === 'KIT' ? 'primary' : 'secondary'} onClick={() => { setAba('KIT'); limparFormulario(); setLinhas([]) }}>
          Kit personalizado
        </Button>
      </div>

      <Card className="mb-6">
        <div className="grid gap-4">
          <Field label="Nome da simulação">
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Lavanda 200g — margem atacado" />
          </Field>

          {aba === 'VELA_INDIVIDUAL' ? (
            <Field label="Vela do catálogo (carrega ficha técnica)">
              <ProductCombobox
                value={produtoReferenciaId}
                onSelect={(produto) => {
                  setProdutoReferenciaId(produto.id)
                  if (!titulo.trim()) setTitulo(produto.nome)
                  void carregarFichaVela(produto.id)
                }}
              />
            </Field>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Adicionar vela ao kit">
                <ProductCombobox value="" onSelect={(p) => adicionarProdutoKit(p.id)} />
              </Field>
              <Field label="Adicionar material / complemento">
                <InsumoCombobox value="" onSelect={(i) => adicionarInsumo(i.id)} />
              </Field>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setLinhas((l) => [...l, novaLinha('INSUMO')])}>
              <Plus className="size-4" />
              Material
            </Button>
            {aba === 'KIT' ? (
              <Button type="button" variant="secondary" onClick={adicionarExtra}>
                <Plus className="size-4" />
                Item extra (caixa, fita…)
              </Button>
            ) : null}
          </div>

          <PrecificacaoTabelaItens linhas={linhas} onChange={setLinhas} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-line bg-paper-deep/40">
              <div className="mb-2 flex items-center gap-2">
                <Calculator className="size-4 text-leaf" />
                <h3 className="font-semibold">Margem e preço</h3>
                {simulando ? (
                  <span className="text-xs font-normal text-ink-soft">Recalculando…</span>
                ) : simulacao ? (
                  <span className="text-xs font-normal text-ink-soft">valores validados no servidor</span>
                ) : erroSimulacao ? (
                  <span className="text-xs font-normal text-amber-700">estimativa local — revise os itens</span>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Margem de lucro (%)">
                  <Input
                    type="number"
                    step="0.01"
                    value={margemPercentual}
                    onChange={(e) => aoSelecionarMargem(e.target.value)}
                  />
                </Field>
                <Field label="Preço de venda (R$)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={precoVenda}
                    onChange={(e) => aoSelecionarPreco(e.target.value)}
                  />
                </Field>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                Custo total: <strong className="text-ink">{formatCurrency(custoTotal)}</strong>
              </p>
              <p className="text-sm text-ink-soft">
                Lucro por unidade: <strong className="text-ink">{formatCurrency(resumo.lucro)}</strong>
              </p>
              {alerta ? (
                <div className="mt-2">
                  <Badge tone={alerta.tone}>{alerta.text}</Badge>
                </div>
              ) : null}
            </Card>

            <Field label="Observações">
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={5} />
            </Field>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={limparFormulario}>
              Limpar
            </Button>
            <Button
              type="button"
              disabled={!titulo.trim() || salvar.isPending}
              onClick={() => {
                if (!titulo.trim()) {
                  toast.error('Informe um nome para a simulação.')
                  return
                }
                salvar.mutate()
              }}
            >
              <Save className="size-4" />
              {salvar.isPending ? 'Salvando…' : editandoId ? 'Atualizar' : 'Salvar simulação'}
            </Button>
          </div>
        </div>
      </Card>

      <h2 className="mb-3 font-display text-xl font-semibold">Simulações salvas</h2>
      {salvos.isLoading ? <LoadingBlock /> : null}
      {!salvos.isLoading && lista.length === 0 ? (
        <EmptyState title="Nenhuma precificação salva" description="Monte uma simulação acima e clique em Salvar." />
      ) : null}
      {lista.length > 0 ? (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Tipo</Th>
                <Th>Custo</Th>
                <Th>Preço</Th>
                <Th>Margem</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white/70">
              {lista.map((item) => (
                <tr key={item.id}>
                  <Td className="font-medium">{item.titulo}</Td>
                  <Td>
                    <Badge tone={item.tipo === 'KIT' ? 'leaf' : 'warn'}>
                      {item.tipo === 'KIT' ? 'Kit' : 'Vela'}
                    </Badge>
                  </Td>
                  <Td>{formatCurrency(item.custoTotal)}</Td>
                  <Td>{formatCurrency(item.precoVenda)}</Td>
                  <Td>{item.margemPercentual}%</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button type="button" variant="ghost" onClick={() => void carregarSalvo(item)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          void carregarSalvo(item).then(() => {
                            setEditandoId(null)
                            setTitulo((t) => (t.trim() ? `${t} (cópia)` : t))
                            toast.message('Cópia carregada — salve com outro nome.')
                          })
                        }
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          aplicarPreco.mutate({
                            id: item.id,
                            produtoId: item.produtoReferenciaId ?? undefined,
                          })
                        }
                      >
                        Aplicar preço
                      </Button>
                      {item.tipo === 'KIT' ? (
                        <Button type="button" variant="ghost" onClick={() => publicarKit.mutate(item.id)}>
                          <Package className="size-4" />
                          Publicar KIT
                        </Button>
                      ) : null}
                      <Button type="button" variant="ghost" onClick={() => excluir.mutate(item.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {salvos.data ? (
            <Paginacao meta={salvos.data} onPaginaChange={setPagina} onTamanhoChange={setTamanho} />
          ) : null}
        </>
      ) : null}
    </div>
  )
}