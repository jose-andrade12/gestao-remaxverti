import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, loginGoogle } = useAuth();

  if (user) {
    return <Navigate to="/" />; 
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <div className="text-center bg-slate-800 p-10 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-2">Gestor Broker</h1>
        <p className="text-slate-400 mb-8">Faça login com o seu e-mail para aceder ao sistema de gestão imobiliária.</p>
        <button 
          onClick={loginGoogle}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg flex items-center justify-center gap-2"
        >
          Entrar com o Google
        </button>
      </div>
    </div>
  );
}