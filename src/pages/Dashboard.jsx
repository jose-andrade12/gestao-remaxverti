import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Home, DollarSign, TrendingUp, Users, Calendar, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Estado para guardar os números reais do Firebase
  const [metricas, setMetricas] = useState({
    imoveis: 0,
    vendas: 0,
    vgv: 0,
    leads: 0
  });

  // Estado para o gráfico de funil
  const [dadosFunil, setDadosFunil] = useState([]);

  useEffect(() => {
    const carregarDadosReais = async () => {
      try {
        // 1. Contar total de Imóveis (Captação)
        const imoveisSnap = await getDocs(collection(db, "imoveis"));
        const totalImoveis = imoveisSnap.size;

        // 2. Contar Vendas e Somar o VGV (Comercialização)
        const vendasSnap = await getDocs(collection(db, "vendas"));
        const totalVendas = vendasSnap.size;
        let vgvTotal = 0;
        vendasSnap.forEach(doc => {
          vgvTotal += (doc.data().valorNumerico || 0);
        });

        // 3. Contar Leads e Agrupar para o Funil (Reciclagem)
        const leadsSnap = await getDocs(collection(db, "leads"));
        const totalLeads = leadsSnap.size;
        
        // Estrutura vazia do funil
        const funilCounts = {
          'Primeiro Contato': 0,
          'Visita Agendada': 0,
          'Visita Realizada': 0,
          'Elaboração de ACM': 0,
          'Apresentação de ACM': 0,
          'Negociação': 0,
          'Venda Recebida': 0
        };

        // Preenche o funil com a fase de cada cliente
        leadsSnap.forEach(doc => {
          const fase = doc.data().faseAtual;
          if (funilCounts[fase] !== undefined) {
            funilCounts[fase]++;
          }
        });

        // Formata os dados para o gráfico do Recharts (esconde as fases com zero)
        const funilFormatado = Object.keys(funilCounts).map(chave => ({
          nome: chave,
          valor: funilCounts[chave]
        })).filter(item => item.valor > 0); 

        setMetricas({
          imoveis: totalImoveis,
          vendas: totalVendas,
          vgv: vgvTotal,
          leads: totalLeads
        });

        // Se não houver clientes no funil, mostra uma mensagem vazia
        setDadosFunil(funilFormatado.length > 0 ? funilFormatado : [{nome: 'Sem clientes no funil', valor: 0}]);
        
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosReais();
  }, []);

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const metricasGerais = [
    { titulo: "Imóveis Angariados", valor: metricas.imoveis, subtitulo: "Total na carteira ativa", icon: Home, cor: "bg-[#003DA5]" },
    { titulo: "Vendas Realizadas", valor: metricas.vendas, subtitulo: "Contratos assinados", icon: TrendingUp, cor: "bg-emerald-500" },
    { titulo: "VGV Total", valor: formatarMoeda(metricas.vgv), subtitulo: "Valor Global de Vendas", icon: DollarSign, cor: "bg-[#DC1C2E]" },
    { titulo: "Leads em Gestão", valor: metricas.leads, subtitulo: "Clientes no CRM", icon: Users, cor: "bg-amber-500" }
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-slate-500 font-medium flex items-center gap-2">
          <TrendingUp className="animate-pulse" /> A processar métricas do negócio...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro e Operacional */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricasGerais.map((metrica, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className={`p-4 rounded-lg text-white ${metrica.cor} shadow-inner`}>
              <metrica.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{metrica.titulo}</p>
              <h3 className="text-2xl font-bold text-slate-800">{metrica.valor}</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">{metrica.subtitulo}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Funil de Vendas Reais */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-[#003DA5] mb-6 flex items-center gap-2">
            <TrendingUp className="text-[#DC1C2E]" size={20} />
            Funil de Conversão (Equipa)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosFunil} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="nome" type="category" width={140} axisLine={false} tickLine={false} className="text-xs font-medium fill-slate-600" />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="valor" fill="#003DA5" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quadro Secundário: Insights do Gestor */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-[#003DA5] mb-6 flex items-center gap-2">
            <AlertCircle className="text-amber-500" size={20} />
            Insights do Sistema
          </h3>
          <div className="flex-1 space-y-4">
             <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <p className="font-bold text-blue-800">Automação de Funil Ativa</p>
                <p className="text-sm text-blue-600 mt-1">O gráfico à esquerda é atualizado em tempo real com base no que os corretores registam na página de <strong>Reciclagem</strong>. Quando um lead muda de fase, o gráfico cresce.</p>
             </div>
             <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <p className="font-bold text-emerald-800">VGV Monitorizado</p>
                <p className="text-sm text-emerald-600 mt-1">O valor de VGV no topo já está a somar automaticamente todos os contratos registados na página de <strong>Comercialização</strong>.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}