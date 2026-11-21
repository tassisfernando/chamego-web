import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ClientesPage } from '@/pages/ClientesPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { FerramentasPage } from '@/pages/FerramentasPage'
import { GastosPage } from '@/pages/GastosPage'
import { InsumosPage } from '@/pages/InsumosPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProducaoPage } from '@/pages/ProducaoPage'
import { PrecificacaoPage } from '@/pages/PrecificacaoPage'
import { ProdutosPage } from '@/pages/ProdutosPage'
import { VendasPage } from '@/pages/VendasPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="vendas" element={<VendasPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="produtos" element={<ProdutosPage />} />
            <Route path="precificacao" element={<PrecificacaoPage />} />
            <Route path="insumos" element={<InsumosPage />} />
            <Route path="producao" element={<ProducaoPage />} />
            <Route path="gastos" element={<GastosPage />} />
            <Route path="ferramentas" element={<FerramentasPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
