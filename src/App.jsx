import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Equipe from './pages/Equipe';
import Captacao from './pages/Captacao';
import Reciclagem from './pages/Reciclagem';
import Comercializacao from './pages/Comercializacao';
import Agenda from './pages/Agenda';
import Relatorios from './pages/Relatorios';

const PrivateRoute = ({ children, requireGestor }) => {
  const { user, role, logout } = useAuth();

  if (!user) return <Navigate to="/login" />;
  
  if (user.status === 'pendente') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0f172a] text-white px-4">
        <div className="text-center bg-slate-800 p-10 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md">
          <div className="text-5xl mb-6">⏳</div>
          <h2 className="text-2xl font-bold mb-2">Acesso em análise</h2>
          <p className="text-slate-400 mb-8">
            O seu perfil de corretor foi registado com sucesso. Aguarde a liberação do Gestor Master para entrar no sistema.
          </p>
          
          <button 
            onClick={logout}
            className="w-full bg-[#DC1C2E] hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <span>🚪</span> Terminar Sessão e Voltar
          </button>
        </div>
      </div>
    );
  }

  if (requireGestor && role !== 'gestor') {
    return <Navigate to="/" />; 
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/" element={<Dashboard />} />
            
            {/* Rotas ativas do sistema */}
            <Route path="/captacao" element={<Captacao />} />
            <Route path="/reciclagem" element={<Reciclagem />} />
            <Route path="/comercializacao" element={<Comercializacao />} />
            <Route path="/agenda" element={<Agenda />} />
            
            {/* Rotas protegidas (Apenas Gestor) */}
            <Route path="/equipe" element={
              <PrivateRoute requireGestor={true}>
                <Equipe />
              </PrivateRoute>
            } />
            <Route path="/relatorios" element={
              <PrivateRoute requireGestor={true}>
                <Relatorios />
              </PrivateRoute>
            } />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}