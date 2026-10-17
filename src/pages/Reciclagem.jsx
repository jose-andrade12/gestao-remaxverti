import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, X, Phone, User, DollarSign, Target } from 'lucide-react';

export default function Reciclagem() {
  const { user, role } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fases do Funil de Vendas Imobiliário
  const fasesFunil = [
    'Primeiro Contato',
    'Visita Agendada',
    'Visita Realizada',
    'Elaboração de ACM',
    'Apresentação de ACM',
    'Negociação',
    'Venda Recebida',
    'Perdido / Frio'
  ];

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    tipo: 'Comprador',
    valorSondado: '',
    faseAtual: 'Primeiro Contato'
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "leads"), orderBy("dataCadastro", "desc"));
      const querySnapshot = await getDocs(q);
      const lista = [];
      querySnapshot.forEach((doc) => {
        // Se for gestor, vê todos. Se for corretor, vê só os dele.
        const data = doc.data();
        if (role === 'gestor' || data.corretorId === user.uid) {
          lista.push({ id: doc.id, ...data });
        }
      });
      setLeads(lista);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [role, user.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatarMoeda = (valor) => {
    const numero = valor.replace(/\D/g, "");
    if (!numero) return "";
    return (Number(numero) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "leads"), {
        ...formData,
        corretorId: user.uid,
        corretorNome: user.displayName,
        dataCadastro: serverTimestamp()
      });
      
      setIsModalOpen(false);
      setFormData({ nome: '', telefone: '', tipo: 'Comprador', valorSondado: '', faseAtual: 'Primeiro Contato' });
      fetchLeads();
      
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      alert("Erro ao registar cliente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualiza a fase do cliente diretamente na tabela
  const atualizarFase = async (id, novaFase) => {
    try {
      const leadRef = doc(db, "leads", id);
      await updateDoc(leadRef, { faseAtual: novaFase });
      fetchLeads(); // Recarrega para mostrar a nova fase
    } catch (error) {
      console.error("Erro ao atualizar fase:", error);
      alert("Não foi possível atualizar o status.");
    }
  };

  // Cores dinâmicas para o status
  const getFaseColor = (fase) => {
    if (fase === 'Venda Recebida') return 'bg-emerald-100 text-emerald-800';
    if (fase === 'Perdido / Frio') return 'bg-slate-200 text-slate-600';
    if (fase === 'Negociação') return 'bg-amber-100 text-amber-800';
    return 'bg-blue-50 text-blue-700';
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#003DA5] flex items-center gap-2">
            <Users className="text-[#DC1C2E]" /> Gestão de Leads (Reciclagem)
          </h2>
          <p className="text-sm text-slate-500 mt-1">Acompanhe os seus clientes pelo funil de vendas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#DC1C2E] hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors"
        >
          <UserPlus size={20} /> Novo Lead
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 border-b">Cliente</th>
                <th className="p-4 border-b">Perfil</th>
                <th className="p-4 border-b">Valor Sondado</th>
                <th className="p-4 border-b">Fase do Funil (Ação)</th>
                {role === 'gestor' && <th className="p-4 border-b">Corretor</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">A carregar leads...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nenhum cliente cadastrado ainda.</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{lead.nome}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{lead.telefone}</p>
                    </td>
                    <td className="p-4">
                       <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {lead.tipo}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{lead.valorSondado || 'Não informado'}</td>
                    
                    {/* Select Dinâmico para mudar a fase */}
                    <td className="p-4">
                      <select 
                        value={lead.faseAtual} 
                        onChange={(e) => atualizarFase(lead.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-none focus:ring-2 focus:ring-[#003DA5] cursor-pointer ${getFaseColor(lead.faseAtual)}`}
                      >
                        {fasesFunil.map(fase => (
                          <option key={fase} value={fase} className="bg-white text-slate-800">{fase}</option>
                        ))}
                      </select>
                    </td>
                    
                    {role === 'gestor' && (
                      <td className="p-4 text-slate-600 text-sm font-medium">{lead.corretorNome}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-[#003DA5]">Registar Novo Lead</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                  <input type="text" name="nome" required value={formData.nome} onChange={handleChange} placeholder="Ex: Carlos Almeida" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5]"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Phone size={18} /></div>
                    <input type="text" name="telefone" required value={formData.telefone} onChange={handleChange} placeholder="(11) 90000-0000" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5]"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Perfil do Lead</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Target size={18} /></div>
                    <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5] bg-white">
                      <option>Comprador</option>
                      <option>Vendedor</option>
                      <option>Investidor</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Sondado (Poder de Compra/Venda)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><DollarSign size={18} /></div>
                  <input type="text" name="valorSondado" value={formData.valorSondado} onChange={(e) => setFormData({...formData, valorSondado: formatarMoeda(e.target.value)})} placeholder="R$ 0,00" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5] font-medium text-emerald-700"/>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#003DA5] hover:bg-blue-800 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">
                  {isSubmitting ? 'A guardar...' : 'Criar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}