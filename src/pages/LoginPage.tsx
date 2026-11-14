import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '@/api/services'
import { Button, Field, Input } from '@/components/ui'
import { salvarSessao, sessaoValida } from '@/lib/auth'
import { parseApiError } from '@/lib/utils'

export function LoginPage() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (sessaoValida()) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)
    try {
      const resposta = await authApi.login({ usuario: usuario.trim(), senha })
      salvarSessao({
        token: resposta.token,
        expiraEm: resposta.expiraEm,
        login: resposta.login,
      })
      toast.success('Login realizado com sucesso.')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(parseApiError(error, 'Usuário ou senha inválidos.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,#dce8df,transparent_45%),radial-gradient(circle_at_bottom_right,#f3e6d4,transparent_40%),linear-gradient(160deg,#f7f3ea,#e8efe9)] px-4 py-10">
      <div className="absolute inset-0 opacity-[0.07] [background-image:url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%231f2a24%27 fill-opacity=%271%27%3E%3Cpath d=%27M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

      <div className="relative w-full max-w-md rounded-3xl border border-line/80 bg-foam/95 p-8 shadow-[0_24px_60px_rgba(31,42,36,0.12)] backdrop-blur">
        <p className="font-display text-4xl font-semibold tracking-tight text-ink">Chamego</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Entrar no Sistema</h1>
        <p className="mt-1 text-sm text-ink-soft">Acesse com seu usuário e senha para continuar.</p>

        <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
          <Field label="Usuário">
            <Input
              autoFocus
              required
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="admin"
            />
          </Field>
          <Field label="Senha">
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" className="mt-2 w-full" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
