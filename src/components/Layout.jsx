import { useAuth } from '../context/AuthContext';
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/captacao', label: 'Captação', icon: '📢' },
    { path: '/comercializacao', label: 'Comercialização', icon: '🤝' },
    { path: '/agenda', label: 'Agenda', icon: '📅' },
    { path: '/reciclagem', label: 'Reciclagem', icon: '♻️' },
  ];

  if (role === 'gestor') {
    menuItems.push({ path: '/equipe', label: 'Equipe & Acessos', icon: '👥' });
    menuItems.push({ path: '/relatorios', label: 'Relatórios do Gestor', icon: '📈' });
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Barra Lateral - Ajustada para Azul Escuro Corporativo */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl z-10 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight">Perfil do Gestor</h1>
          <p className="text-sm font-bold text-[#DC1C2E] mt-1 tracking-wider">RE/MAX VERTI</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                location.pathname === item.path 
                  ? 'bg-[#DC1C2E] text-white font-medium shadow-md' // Vermelho RE/MAX no menu ativo
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-10 h-10 rounded-full bg-[#003DA5] border-2 border-white/10 flex items-center justify-center text-white font-bold shadow-inner">
                {user?.displayName?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-white text-sm font-medium truncate">{user?.displayName}</p>
               <p className="text-xs text-[#DC1C2E] font-bold capitalize">{role}</p>
             </div>
          </div>
          <button 
            onClick={logout}
            className="w-full text-left px-4 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-3"
          >
            <span>🚪</span> Terminar Sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-0">
           <h2 className="text-xl font-semibold text-[#003DA5]">
              {menuItems.find(m => m.path === location.pathname)?.label || 'Painel'}
           </h2>
           <div className="text-sm font-medium text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">
             {new Date().toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}