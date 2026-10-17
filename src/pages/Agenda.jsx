import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Plus, X, Clock, MapPin, User, Tag, Trash2 } from 'lucide-react';

export default function Agenda() {
  const { user, role } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    data: '',
    hora: '',
    tipo: 'Visita',
    cliente: '',
    local: ''
  });

  const fetchEventos = async () => {
    setLoading(true);
    try {
      // Ordena pelos eventos mais próximos de acontecer
      const q = query(collection(db, "agenda"), orderBy("data", "asc"), orderBy("hora", "asc"));
      const querySnapshot = await getDocs(q);
      const lista = [];
      querySnapshot.forEach((doco) => {
        const data = doco.data();
        if (role === 'gestor' || data.corretorId === user.uid) {
          lista.push({ id: doco.id, ...data });
        }
      });
      setEventos(lista);
    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, [role, user.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "agenda"), {
        ...formData,
        corretorId: user.uid,
        corretorNome: user.displayName,
        dataCadastro: serverTimestamp()
      });
      
      setIsModalOpen(false);
      setFormData({ titulo: '', data: '', hora: '', tipo: 'Visita', cliente: '', local: '' });
      fetchEventos();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      alert("Erro ao marcar na agenda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const excluirEvento = async (id) => {
    if (window.confirm("Tem a certeza que deseja cancelar e apagar este evento da agenda?")) {
      try {
        await deleteDoc(doc(db, "agenda", id));
        fetchEventos();
      } catch (error) {
        alert("Erro ao excluir evento.");
      }
    }
  };

  // Formata a data de YYYY-MM-DD para DD/MM/YYYY
  const formatarData = (dataString) => {
    if (!dataString) return '';
    return dataString.split('-').reverse().join('/');
  };

  // Define uma cor para cada tipo de compromisso
  const getTipoEstilo = (tipo) => {
    switch(tipo) {
      case 'Visita': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Reunião': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Assinatura': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Captação': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-[#003DA5]">
        <div>
          <h2 className="text-xl font-bold text-[#003DA5] flex items-center gap-2">
            <CalendarIcon className="text-[#003DA5]" /> Agenda da Equipa
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gira os seus compromissos, visitas e reuniões.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#003DA5] hover:bg-blue-800 text-white rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus size={20} /> Novo Compromisso
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">A carregar agenda...</div>
      ) : eventos.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 flex flex-col items-center">
          <CalendarIcon size={48} className="text-slate-300 mb-4" />
          <p className="text-lg font-medium text-slate-600">A sua agenda está livre</p>
          <p className="text-sm">Nenhum compromisso marcado para os próximos dias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {eventos.map((evento) => (
            <div key={evento.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-transform hover:-translate-y-1">
              <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b flex justify-between items-center ${getTipoEstilo(evento.tipo)}`}>
                <span>{evento.tipo}</span>
                {role === 'gestor' && <span className="text-[10px] opacity-80">{evento.corretorNome}</span>}
              </div>
              
              <div className="p-5 flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{evento.titulo}</h3>
                  <div className="flex gap-4 mt-2">
                    <p className="text-sm font-semibold text-[#DC1C2E] flex items-center gap-1">
                      <CalendarIcon size={14} /> {formatarData(evento.data)}
                    </p>
                    <p className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                      <Clock size={14} /> {evento.hora}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 pt-3 border-t border-slate-100">
                  <p className="flex items-start gap-2">
                    <User size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="font-medium">{evento.cliente}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{evento.local}</span>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => excluirEvento(evento.id)}
                  className="p-2 text-slate-400 hover:text-[#DC1C2E] hover:bg-red-50 rounded-lg transition-colors"
                  title="Cancelar Compromisso"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-[#003DA5]">Agendar Compromisso</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Compromisso</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Tag size={18} /></div>
                  <input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} placeholder="Ex: Visita ao Apto 33" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5]"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><CalendarIcon size={18} /></div>
                    <input type="date" name="data" required value={formData.data} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5]"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hora</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Clock size={18} /></div>
                    <input type="time" name="hora" required value={formData.hora} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5]"/>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Evento</label>
                  <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5] bg-white">
                    <option>Visita</option>
                    <option>Reunião</option>
                    <option>Captação</option>
                    <option>Assinatura</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                    <input type="text" name="cliente" required value={formData.cliente} onChange={handleChange} placeholder="Comprador ou Vendedor" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5]"/>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Local / Morada</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><MapPin size={18} /></div>
                  <input type="text" name="local" required value={formData.local} onChange={handleChange} placeholder="Endereço ou Link da Reunião" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003DA5]"/>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#003DA5] hover:bg-blue-800 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">
                  {isSubmitting ? 'A guardar...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}