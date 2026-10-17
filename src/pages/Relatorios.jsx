import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Download, TrendingUp } from 'lucide-react';

export default function Relatorios() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const vendasSnap = await getDocs(collection(db, "vendas"));
        const listaVendas = [];
        vendasSnap.forEach(doc => listaVendas.push(doc.data()));
        setVendas(listaVendas);
      } catch (error) {
        console.error("Erro ao gerar relatórios:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, []);

  // Agrupar VGV por Corretor para o Gráfico
  const dadosCorretor = vendas.reduce((acc, venda) => {
    const nome = venda.corretorNome || 'Desconhecido';
    if (!acc[nome]) acc[nome] = 0;
    acc[nome] += (venda.valorNumerico || 0);
    return acc;
  }, {});

  const graficoData = Object.keys(dadosCorretor).map(nome => ({
    nome,
    VGV: dadosCorretor[nome]
  }));

  // Função para exportar os dados para CSV (Excel)
  const exportarCSV = () => {
    if (vendas.length === 0) return alert("Não há vendas para exportar.");
    
    // Cabeçalhos do Excel
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,Imovel,Cliente,Corretor,VGV (R$),Comissao Imobiliaria (R$),Comissao Corretor (R$)\n";

    // Dados das vendas
    vendas.forEach(v => {
      const dataVenda = v.dataVenda ? v.dataVenda.split('-').reverse().join('/') : '';
      const linha = `"${dataVenda}","${v.imovel}","${v.cliente}","${v.corretorNome}",${v.valorNumerico},${v.comissaoTotal},${v.comissaoCorretor}`;
      csvContent += linha + "\n";
    });

    // Fazer o download do ficheiro
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_vendas_remax_verti.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#003DA5] flex items-center gap-2">
            <FileText className="text-[#DC1C2E]" /> Relatórios de Desempenho
          </h2>
          <p className="text-sm text-slate-500 mt-1">Análise de VGV por corretor e exportação de dados.</p>
        </div>
        <button 
          onClick={exportarCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#003DA5] hover:bg-blue-800 text-white rounded-lg font-medium shadow-sm transition-colors"
        >
          <Download size={20} /> Exportar Vendas (Excel)
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="text-emerald-500" size={20} />
          Ranking de Corretores (VGV Gerado)
        </h3>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">A processar dados...</div>
        ) : graficoData.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Ainda não existem vendas registadas.</div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="nome" axisLine={false} tickLine={false} className="text-xs font-medium fill-slate-600" />
                <YAxis tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} axisLine={false} tickLine={false} className="text-xs font-medium fill-slate-400" />
                <Tooltip 
                  formatter={(value) => formatarMoeda(value)}
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="VGV" fill="#DC1C2E" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}