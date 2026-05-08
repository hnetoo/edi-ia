import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  CheckCircle,
  XCircle,
  MapPin
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReservationsViewProps {
  residents: any[];
}

const ReservationsView: React.FC<ReservationsViewProps> = ({ residents }) => {
  const [reservations, setReservations] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    resident_id: '',
    resource: 'salao_festas',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    purpose: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resources = [
    { id: 'salao_festas', name: 'Salão de Festas', capacity: 50, icon: '🎉' },
    { id: 'piscina', name: 'Piscina', capacity: 20, icon: '🏊' },
    { id: 'academia', name: 'Academia', capacity: 10, icon: '💪' },
    { id: 'salao_jogos', name: 'Salão de Jogos', capacity: 15, icon: '🎮' },
    { id: 'churrasqueira', name: 'Área de Churrasco', capacity: 25, icon: '🔥' },
    { id: 'sala_reunioes', name: 'Sala de Reuniões', capacity: 12, icon: '💼' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      const endDateTime = `${formData.end_date}T${formData.end_time}:00`;

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: parseInt(formData.resident_id),
          resource: formData.resource,
          start_date: startDateTime,
          end_date: endDateTime,
          purpose: formData.purpose
        })
      });

      const data = await response.json();
      if (data.success) {
        // Add to local state
        const newReservation = {
          id: data.reservationId,
          resident_name: residents.find(r => r.id === parseInt(formData.resident_id))?.name || 'Morador',
          resource: resources.find(r => r.id === formData.resource)?.name || formData.resource,
          start_date: startDateTime,
          end_date: endDateTime,
          purpose: formData.purpose,
          status: 'Confirmed',
          created_at: new Date().toISOString()
        };
        setReservations([newReservation, ...reservations]);
        
        // Reset form
        setFormData({
          resident_id: '',
          resource: 'salao_festas',
          start_date: '',
          start_time: '',
          end_date: '',
          end_time: '',
          purpose: ''
        });
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-500/10 text-green-500';
      case 'Pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'Cancelled': return 'bg-red-500/10 text-red-500';
      default: return 'bg-brand/10 text-brand';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-white">Reservas de Espaços</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
        >
          <Plus size={16} /> Nova Reserva
        </button>
      </div>

      {/* Resources Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {resources.map((resource) => (
          <div key={resource.id} className="glass-card p-6 hover:border-brand/20 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl">{resource.icon}</div>
              <div>
                <h4 className="text-lg font-bold text-white">{resource.name}</h4>
                <p className="text-sm text-ink-muted">Capacidade: {resource.capacity} pessoas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <MapPin size={12} />
              <span>Disponível para reserva</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reservations List */}
      <div className="glass-card p-8">
        <h4 className="text-xl font-bold text-white mb-6">Reservas Ativas</h4>
        {reservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-brand/20 mb-4" />
            <p className="text-ink-muted">Nenhuma reserva encontrada</p>
            <p className="text-sm text-ink-muted/60 mt-2">Crie uma nova reserva para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    reservation.status === 'Confirmed' ? "bg-green-500/20" : "bg-yellow-500/20"
                  )}>
                    {reservation.status === 'Confirmed' ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <Clock className="text-yellow-500" size={20} />
                    )}
                  </div>
                  <div>
                    <h5 className="text-white font-semibold">{reservation.resource}</h5>
                    <p className="text-sm text-ink-muted">{reservation.resident_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{formatDate(reservation.start_date)}</p>
                  <span className={cn(
                    "text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest",
                    getStatusColor(reservation.status)
                  )}>
                    {reservation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 w-full max-w-lg mx-4"
          >
            <h4 className="text-xl font-bold text-white mb-6">Nova Reserva</h4>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Morador</label>
                <select
                  value={formData.resident_id}
                  onChange={(e) => setFormData({...formData, resident_id: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50"
                  required
                >
                  <option value="">Selecione um morador</option>
                  {residents.map((resident) => (
                    <option key={resident.id} value={resident.id} className="bg-surface-dark">
                      {resident.name} - {resident.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Espaço</label>
                <select
                  value={formData.resource}
                  onChange={(e) => setFormData({...formData, resource: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50"
                  required
                >
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id} className="bg-surface-dark">
                      {resource.icon} {resource.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Data Início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Hora Início</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Data Fim</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Hora Fim</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Finalidade</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder="Ex: Aniversário, reunião, etc."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-ink-muted/50 focus:outline-none focus:border-brand/50"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-ink-muted hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Reserva'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ReservationsView;
