import React from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  MessageSquare, 
  Share2, 
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CommunicationsViewProps {
  residents: any[];
}

const CommunicationsView: React.FC<CommunicationsViewProps> = ({ residents }) => {
  const [message, setMessage] = React.useState('');
  const [selectedRecipients, setSelectedRecipients] = React.useState<string[]>([]);
  const [messageType, setMessageType] = React.useState<'notification' | 'urgent' | 'reminder'>('notification');
  const [isSending, setIsSending] = React.useState(false);
  const [sentMessages, setSentMessages] = React.useState<any[]>([]);

  const handleSendWhatsApp = async () => {
    if (!message.trim() || selectedRecipients.length === 0) return;

    setIsSending(true);
    try {
      const recipients = residents.filter(r => selectedRecipients.includes(r.id.toString()));
      
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          recipients,
          type: messageType
        })
      });

      const data = await response.json();
      if (data.success) {
        setSentMessages([
          {
            id: Date.now(),
            message,
            recipients: selectedRecipients.length,
            type: messageType,
            timestamp: new Date(),
            status: 'sent'
          },
          ...sentMessages
        ]);
        setMessage('');
        setSelectedRecipients([]);
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    } finally {
      setIsSending(false);
    }
  };

  const toggleRecipient = (residentId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(residentId) 
        ? prev.filter(id => id !== residentId)
        : [...prev, residentId]
    );
  };

  const selectAll = () => {
    setSelectedRecipients(residents.map(r => r.id.toString()));
  };

  const clearSelection = () => {
    setSelectedRecipients([]);
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      {/* WhatsApp Broadcast Section */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <Send className="text-green-500" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Broadcast WhatsApp</h3>
            <p className="text-xs text-ink-muted">Envie mensagens para múltiplos moradores</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Message Type Selection */}
          <div className="flex gap-2">
            {[
              { value: 'notification', label: 'Notificação', color: 'bg-brand/10 text-brand' },
              { value: 'urgent', label: 'Urgente', color: 'bg-red-500/10 text-red-500' },
              { value: 'reminder', label: 'Lembrete', color: 'bg-yellow-500/10 text-yellow-500' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setMessageType(type.value as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  messageType === type.value ? type.color : 'text-ink-muted hover:text-white'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Message Input */}
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-ink-muted/50 focus:outline-none focus:border-brand/50 resize-none h-32"
            />
          </div>

          {/* Recipients Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-ink-muted" />
                <span className="text-sm font-bold text-white">
                  Destinatários ({selectedRecipients.length}/{residents.length})
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-ink-muted hover:text-brand transition-colors"
                >
                  Selecionar Todos
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs text-ink-muted hover:text-brand transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {residents.map((resident) => (
                <label
                  key={resident.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedRecipients.includes(resident.id.toString())}
                    onChange={() => toggleRecipient(resident.id.toString())}
                    className="rounded border-white/20 bg-white/10 text-brand focus:ring-brand focus:ring-offset-0"
                  />
                  <span className="text-xs text-white truncate">
                    {resident.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendWhatsApp}
            disabled={!message.trim() || selectedRecipients.length === 0 || isSending}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-white/10 disabled:text-ink-muted text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send size={16} />
                Enviar WhatsApp ({selectedRecipients.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sent Messages History */}
      {sentMessages.length > 0 && (
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-white mb-6">Mensagens Enviadas</h3>
          <div className="space-y-4">
            {sentMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-green-500" size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest",
                      msg.type === 'urgent' ? "bg-red-500/10 text-red-500" :
                      msg.type === 'reminder' ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-brand/10 text-brand"
                    )}>
                      {msg.type}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-ink-muted">
                      <Clock size={10} />
                      {new Date(msg.timestamp).toLocaleString('pt-PT')}
                    </div>
                  </div>
                  <p className="text-sm text-white mb-2">{msg.message}</p>
                  <p className="text-xs text-ink-muted">
                    Enviado para {msg.recipients} morador(es)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Communications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Interrupção de Água - Limpeza Tanque', date: '08 Mai 2026', type: 'Urgente', desc: 'Informamos que amanhã entre as 09:00 e as 13:00 o abastecimento de água será interrompido para manutenção anual.' },
          { title: 'Assembleia Geral Ordinária', date: '15 Mai 2026', type: 'Administrativo', desc: 'Convocatória para a reunião de apresentação de contas e aprovação de novo orçamento para 2026/27.' },
          { title: 'Novas Regras Uso Piscina', date: '01 Mai 2026', type: 'Regulamento', desc: 'Relembramos a todos os moradores que o uso de garrafas de vidro na área de lazer é estritamente proibido.' },
        ].map((comm, i) => (
          <div key={i} className={cn(
             "glass-card p-8 flex flex-col gap-4 border-l-4 relative group",
             comm.type === 'Urgente' ? "border-l-red-500" : "border-l-brand"
          )}>
            <div className="flex justify-between items-start">
              <span className={cn(
                "text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest",
                comm.type === 'Urgente' ? "bg-red-500/10 text-red-500" : "bg-brand/10 text-brand"
              )}>
                {comm.type}
              </span>
              <span className="text-[10px] text-ink-muted font-mono">{comm.date}</span>
            </div>
            <h4 className="text-xl font-bold text-white group-hover:text-brand transition-colors">{comm.title}</h4>
            <p className="text-sm text-ink-muted leading-relaxed line-clamp-3">{comm.desc}</p>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
              <button className="text-xs font-bold text-brand uppercase tracking-widest hover:underline text-left">Ler na íntegra</button>
              
              <button 
                onClick={() => {
                  const text = `*EDI IA - ${comm.type}*\n\n*${comm.title}*\n\n${comm.desc}\n\n_Data: ${comm.date}_`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex items-center gap-2 text-[10px] bg-green-600/10 text-green-500 px-4 py-2 rounded-lg font-bold uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all"
              >
                <Share2 size={14} /> WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CommunicationsView;
