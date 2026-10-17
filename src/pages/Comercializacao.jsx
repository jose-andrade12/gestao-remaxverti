import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Handshake, Plus, X, DollarSign, Calendar, User, Home, TrendingUp } from 'lucide-react';

export default function Comercializacao() {
  const { user, role } = useAuth();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    imovel: '',
    cliente: '',
    valor: '',
    dataVenda: '',
    comissaoImobiliaria: '6', // % Padrão
    repasseCorretor: '50' // % Padrão do Corretor
  });

  const fetchVendas = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "vendas"), orderBy("dataCadastro", "desc"));
      const querySnapshot = await getDocs(q);
      const lista = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (role === 'gestor' || data.corretorId === user.uid) {
          lista.push({ id: doc.id, ...data });
        }
      });
      setVendas(lista);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
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

  // Converte a string "R$ 1.500.000,00" para número para fazer cálculos
  const converterParaNumero = (valorMoeda) => {
    if (!valorMoeda) return 0;
    return Number(valorMoeda.replace(/[^0-9,-]+/g,"").replace(",", "."));
  };

  const formatarNumeroParaMoeda = (numero) => {
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Cálculos automáticos antes de salvar
    const valorNumerico = converterParaNumero(formData.valor);
    const comissaoTotal = valorNumerico * (Number(formData.comissaoImobiliaria) / 100);
    const comissaoCorretor = comissaoTotal * (Number(formData.repasseCorretor) / 100);

    try {
      await addDoc(collection(db, "vendas"), {
        ...formData,
        valorNumerico,
        comissaoTotal,
        comissaoCorretor,
        corretorId: user.uid,
        corretorNome: user.displayName,
        dataCadastro: serverTimestamp()
      });
      
      setIsModalOpen(false);
      setFormData({ imovel: '', cliente: '', valor: '', dataVenda: '', comissaoImobiliaria: '6', repasseCorretor: '50' });
      fetchVendas();
    } catch (error) {
      console.error("Erro ao salvar venda:", error);
      alert("Erro ao registar a venda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculos para o Dashboard Superior
  const totalVGV = vendas.reduce((acc, venda) => acc + (venda.valorNumerico || 0), 0);
  const totalComissaoLoja = vendas.reduce((acc, venda) => acc + (venda.comissaoTotal || 0), 0);
  const totalComissaoCorretor = vendas.reduce((acc, venda) => acc + (venda.comissaoCorretor || 0), 0);

  return (
    <div className="space-y-6">
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-emerald-500">
        <div>
          <h2 className="text-xl font-bold text-[#003DA5] flex items-center gap-2">
            <Handshake className="text-emerald-500" /> Comercialização
          </h2>
          <p className="text-sm text-slate-500 mt-1">Acompanhe os contratos fechados e o comissionamento.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus size={20} /> Registar Venda
        </button>
      </div>

      {/* Cartões de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-blue-500"/> VGV Total</p>
          <h3 className="text-2xl font-bold text-slate-800">{formatarNumeroParaMoeda(totalVGV)}</h3>
          <p className="text-xs text-slate-400 mt-1">{vendas.length} imóveis vendidos</p>
        </div>
        
        {role === 'gestor' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-2"><DollarSign size={16} className="text-emerald-500"/> Receita Imobiliária Bruta</p>
            <h3 className="text-2xl font-bold text-emerald-600">{formatarNumeroParaMoeda(totalComissaoLoja)}</h3>
            <p className="text-xs text-slate-400 mt-1">Comissões totais geradas</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-2"><User size={16} className="text-amber-500"/> Comissões Corretores</p>
          <h3 className="text-2xl font-bold text-amber-600">{formatarNumeroParaMoeda(totalComissaoCorretor)}</h3>
          <p className="text-xs text-slate-400 mt-1">Repasse total da equipa</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 border-b">Imóvel & Cliente</th>
                <th className="p-4 border-b">Data</th>
                <th className="p-4 border-b">VGV (Valor)</th>
                {role === 'gestor' && <th className="p-4 border-b">Comissão Loja</th>}
                <th className="p-4 border-b">Comissão Corretor</th>
                <th className="p-4 border-b">Corretor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">A carregar vendas...</td></tr>
              ) : vendas.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Nenhuma venda registada ainda.</td></tr>
              ) : (
                vendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 truncate max-w-[200px]">{venda.imovel}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Comprador: {venda.cliente}</p>
                    </td>
                    <td className="p-4 text-slate-600">{venda.dataVenda.split('-').reverse().join('/')}</td>
                    <td className="p-4 font-semibold text-[#003DA5]">{venda.valor}</td>
                    
                    {role === 'gestor' && (
                      <td className="p-4 text-emerald-600 font-medium">
                        {formatarNumeroParaMoeda(venda.comissaoTotal)}
                        <span className="text-xs text-slate-400 block">{venda.comissaoImobiliaria}%</span>
                      </td>
                    )}
                    
                    <td className="p-4 text-amber-600 font-medium">
                      {formatarNumeroParaMoeda(venda.comissaoCorretor)}
                      <span className="text-xs text-slate-400 block">Repasse: {venda.repasseCorretor}%</span>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{venda.corretorNome}</td>
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
              <h3 className="text-lg font-bold text-emerald-600">Registar Nova Venda</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Imóvel Negociado</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Home size={18} /></div>
                  <input type="text" name="imovel" required value={formData.imovel} onChange={handleChange} placeholder="Ex: Apto 33 - Edifício Flores" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Comprador (Lead)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                  <input type="text" name="cliente" required value={formData.cliente} onChange={handleChange} placeholder="Nome do Cliente" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor da Venda (VGV)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><DollarSign size={18} /></div>
                    <input type="text" name="valor" required value={formData.valor} onChange={(e) => setFormData({...formData, valor: formatarMoeda(e.target.value)})} placeholder="R$ 0,00" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium text-[#003DA5]"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Assinatura</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Calendar size={18} /></div>
                    <input type="date" name="dataVenda" required value={formData.dataVenda} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"/>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Comissão da Imobiliária (%)</label>
                  <input type="number" name="comissaoImobiliaria" required value={formData.comissaoImobiliaria} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Repasse ao Corretor (%)</label>
                  <input type="number" name="repasseCorretor" required value={formData.repasseCorretor} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"/>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">
                  {isSubmitting ? 'A processar...' : 'Confirmar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}