import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Boxes,
  CircleDollarSign,
  Factory,
  Flame,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { limparSessao, obterLogin } from '@/lib/auth'
import { cn, formatDateTimePt } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/vendas', label: 'Vendas', icon: CircleDollarSign },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/produtos', label: 'Velas e kits', icon: Flame },
  { to: '/insumos', label: 'Estoque', icon: FlaskConical },
  { to: '/producao', label: 'Produção', icon: Factory },
  { to: '/gastos', label: 'Gastos', icon: Boxes },
  { to: '/ferramentas', label: 'Ferramentas', icon: Wrench },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const login = obterLogin()

  function sair() {
    limparSessao()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[260px] border-r border-line/80 bg-leaf text-foam transition lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-8 px-2">
            <p className="font-display text-3xl font-semibold tracking-tight">Chamego</p>
            <p className="mt-1 text-sm text-foam/70">Gestão das velas artesanais</p>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive ? 'bg-foam/15 text-foam' : 'text-foam/75 hover:bg-foam/10 hover:text-foam',
                    )
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-foam/10 px-3 py-3 text-xs text-foam/80">
              Hoje é {formatDateTimePt()}.
              <br />
              {login ? `Conectado como ${login}.` : 'Sessão ativa por 24 horas.'}
            </div>
            <button
              type="button"
              onClick={sair}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-foam/10 px-3 py-2.5 text-sm font-medium text-foam/90 transition hover:bg-foam/20"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line/70 bg-paper/80 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-foam px-3 py-2 text-sm font-medium lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-4" />
            Menu
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-ink-soft">Painel de gestão</p>
          </div>
          <button
            type="button"
            className={cn('rounded-xl border border-line bg-foam p-2 lg:hidden', !open && 'invisible')}
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </button>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
