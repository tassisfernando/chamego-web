const TOKEN_KEY = 'chamego.auth.token'
const EXPIRA_KEY = 'chamego.auth.expiraEm'
const LOGIN_KEY = 'chamego.auth.login'

export type SessaoAuth = {
  token: string
  expiraEm: string
  login: string
}

export function salvarSessao(sessao: SessaoAuth) {
  localStorage.setItem(TOKEN_KEY, sessao.token)
  localStorage.setItem(EXPIRA_KEY, sessao.expiraEm)
  localStorage.setItem(LOGIN_KEY, sessao.login)
}

export function limparSessao() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRA_KEY)
  localStorage.removeItem(LOGIN_KEY)
}

export function obterToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function obterLogin(): string | null {
  return localStorage.getItem(LOGIN_KEY)
}

export function obterExpiracao(): string | null {
  return localStorage.getItem(EXPIRA_KEY)
}

export function sessaoValida(): boolean {
  const token = obterToken()
  const expiraEm = obterExpiracao()
  if (!token || !expiraEm) return false
  const expiracao = Date.parse(expiraEm)
  if (Number.isNaN(expiracao)) return false
  return Date.now() < expiracao
}
