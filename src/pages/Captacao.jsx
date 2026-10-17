import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Home, Plus, X, MapPin, DollarSign, User, Tag } from 'lucide-react';

export default function Captacao() {
  const { user } = useAuth();
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Apartamento',
    bairro: '',
    valor: '',
    proprietario: '',
  });

  // Função para buscar os imóveis no Firebase
  const fetchImoveis = async () => {
    setLoading(true);
    try {
      // Busca os imóveis ordenados pelos mais recentes
      const q = query(collection(db, "imoveis"), orderBy("dataCadastro", "desc"));
      const querySnapshot = await getDocs(q);
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setImoveis(lista);
    } catch (error) {
      console.error("Erro ao buscar imóveis:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImoveis();
  }, []);

  // Função para lidar com a digitação no formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para formatar moeda (R$) à medida que digita
  const formatarMoeda = (valor) => {
    const numero = valor.replace(/\D/g, "");
    if (!numero) return "";
    const formatado = (Number(numero) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return formatado;
  };

  // Salvar novo imóvel no Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "imoveis"), {
        ...formData,
        corretorId: user.uid,
        corretorNome: user.displayName,
        status: 'Disponível', // Status padrão
        dataCadastro: serverTimestamp()
      });
      
      setIsModalOpen(false); // Fecha o modal
      setFormData({ titulo: '', tipo: 'Apartamento', bairro: '', valor: '', proprietario: '' }); // Limpa o form
      fetchImoveis(); // Atualiza a tabela
      
    } catch (error) {
      console.error("Erro ao salvar imóvel:", error);
      alert("Erro ao registar captação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#003DA5] flex items-center gap-2">
            <Home className="text-[#DC1C2E]" /> Gestão de Captações
          </h2>
          <p className="text-sm text-slate-500 mt-1">Registe e acompanhe a sua carteira de imóveis.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#003DA5] hover:bg-blue-800 text-white rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus size={20} /> Nova Captação
        </button>
      </div>

      {/* Tabela de Imóveis */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 border-b">Imóvel & Localização</th>
                <th className="p-4 border-b">Tipo</th>
                <th className="p-4 border-b">Valor</th>
                <th className="p-4 border-b">Proprietário</th>
                <th className="p-4 border-b">Angariador</th>
                <th className="p-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">A carregar carteira de imóveis...</td></tr>
              ) : imoveis.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Nenhum imóvel cadastrado ainda.</td></tr>
              ) : (
                imoveis.map((imovel) => (
                  <tr key={imovel.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{imovel.titulo}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={12}/> {imovel.bairro}</p>
                    </td>
                    <td className="p-4 text-slate-600">{imovel.tipo}</td>
                    <td className="p-4 font-semibold text-emerald-600">{imovel.valor}</td>
                    <td className="p-4 text-slate-600">{imovel.proprietario}</td>
                    <td className="p-4 text-slate-600 text-sm">{imovel.corretorNome}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {imovel.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nova Captação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-[#003DA5]">Registar Novo Imóvel</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Anúncio</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Tag size={18} /></div>
                  <input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} placeholder="Ex: Lindo Apartamento com Varanda" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5] focus:ring-1 focus:ring-[#003DA5]"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Imóvel</label>
                  <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5] focus:ring-1 focus:ring-[#003DA5] bg-white">
                    <option>Apartamento</option>
                    <option>Casa</option>
                    <option>Casa de Condomínio</option>
                    <option>Comercial</option>
                    <option>Terreno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bairro / Região</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><MapPin size={18} /></div>
                    <input type="text" name="bairro" required value={formData.bairro} onChange={handleChange} placeholder="Ex: Santana" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5] focus:ring-1 focus:ring-[#003DA5]"/>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor do Imóvel</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><DollarSign size={18} /></div>
                    <input type="text" name="valor" required value={formData.valor} onChange={(e) => setFormData({...formData, valor: formatarMoeda(e.target.value)})} placeholder="R$ 0,00" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5] focus:ring-1 focus:ring-[#003DA5] font-medium text-emerald-700"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Proprietário</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                    <input type="text" name="proprietario" required value={formData.proprietario} onChange={handleChange} placeholder="Nome do Cliente" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5] focus:ring-1 focus:ring-[#003DA5]"/>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#DC1C2E] hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">
                  {isSubmitting ? 'A guardar...' : 'Guardar Captação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}