import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserCheck, ShieldAlert, UserCog, UserPlus, Edit, Trash2, X, Mail, User } from 'lucide-react';

export default function Equipe() {
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para controlar a janela modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: 'corretor'
  });

  const fetchEquipe = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "usuarios"));
      const querySnapshot = await getDocs(q);
      const listaMembros = [];
      querySnapshot.forEach((documento) => {
        listaMembros.push({ id: documento.id, ...documento.data() });
      });
      setMembros(listaMembros);
    } catch (error) {
      console.error("Erro ao buscar equipe:", error);
    } finally {
      // Garante que o estado de "a carregar" sai do ecrã mesmo se houver erro
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para registar um membro manualmente
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "usuarios"), {
        nome: formData.nome,
        email: formData.email,
        perfil: formData.perfil,
        status: 'ativo', // Ao ser adicionado pelo Gestor, entra logo como ativo
        dataCadastro: serverTimestamp()
      });
      
      setIsModalOpen(false); // Fecha a janela
      setFormData({ nome: '', email: '', perfil: 'corretor' }); // Limpa o formulário
      fetchEquipe(); // Recarrega a tabela para mostrar o novo corretor
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      alert("Erro ao adicionar o integrante. Verifique a sua ligação ao banco de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const aprovarAcesso = async (idUsuario) => {
    if (window.confirm("Aprovar o acesso deste corretor ao sistema?")) {
      try {
        await updateDoc(doc(db, "usuarios", idUsuario), { status: "ativo" });
        fetchEquipe();
      } catch (error) {
        alert("Erro ao aprovar utilizador.");
      }
    }
  };

  const excluirMembro = async (idUsuario, nome) => {
    if (window.confirm(`Tem a certeza que deseja excluir permanentemente o acesso de ${nome}?`)) {
      try {
        await deleteDoc(doc(db, "usuarios", idUsuario));
        fetchEquipe();
      } catch (error) {
        alert("Erro ao excluir utilizador.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-[#003DA5] flex items-center gap-2">
              <UserCog className="text-[#DC1C2E]" /> Gestão de Acessos
            </h2>
            <p className="text-sm text-slate-500 mt-1">Gira os perfis e aprove novos corretores para a sua equipa.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white text-slate-600 rounded-lg font-medium shadow-sm border border-slate-200">
               Total: {membros.length}
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#003DA5] hover:bg-blue-800 text-white rounded-lg font-medium shadow-sm transition-colors"
            >
              <UserPlus size={18} /> Novo Integrante
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 border-b">Nome</th>
                <th className="p-4 border-b">E-mail</th>
                <th className="p-4 border-b">Perfil</th>
                <th className="p-4 border-b">Status</th>
                <th className="p-4 border-b text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">A carregar equipa...</td></tr>
              ) : membros.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nenhum membro encontrado.</td></tr>
              ) : (
                membros.map((membro) => (
                  <tr key={membro.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{membro.nome || 'Sem Nome'}</td>
                    <td className="p-4 text-slate-600">{membro.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        membro.perfil === 'gestor' ? 'bg-[#003DA5]/10 text-[#003DA5]' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {membro.perfil}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1 ${
                        membro.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {membro.status === 'ativo' ? <UserCheck size={14}/> : <ShieldAlert size={14}/>}
                        {membro.status === 'ativo' ? 'Ativo' : 'Pendente'}
                      </span>
                    </td>
                    
                    <td className="p-4 text-center">
                      {membro.status === 'pendente' && membro.perfil !== 'gestor' ? (
                        <button 
                          onClick={() => aprovarAcesso(membro.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                          Aprovar
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2 text-[#003DA5] hover:bg-blue-50 rounded-lg transition-colors" title="Editar Perfil">
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => excluirMembro(membro.id, membro.nome)}
                            className="p-2 text-[#DC1C2E] hover:bg-red-50 rounded-lg transition-colors" 
                            title="Excluir Membro"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Pop-up de Novo Integrante */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-[#003DA5]">Adicionar Membro</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                  <input type="text" name="nome" required value={formData.nome} onChange={handleChange} placeholder="Ex: João Silva" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5]"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (Conta Google)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail size={18} /></div>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="joao@gmail.com" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5]"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Perfil de Acesso</label>
                <select name="perfil" value={formData.perfil} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5] bg-white">
                  <option value="corretor">Corretor (Acesso Normal)</option>
                  <option value="gestor">Gestor (Acesso Total)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#003DA5] hover:bg-blue-800 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">
                  {isSubmitting ? 'A guardar...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}