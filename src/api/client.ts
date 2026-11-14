import axios from 'axios'
import { limparSessao, obterToken, sessaoValida } from '@/lib/auth'

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (!sessaoValida()) {
    if (obterToken()) {
      limparSessao()
    }
    return config
  }
  const token = obterToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = String(error?.config?.url ?? '')
    if (status === 401 && !url.includes('/api/auth/login')) {
      limparSessao()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)
