import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LoginPage = ({ onLogin, buildingName }: { onLogin: (user: any) => void, buildingName: string }) => {
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Erro ao entrar');
        setPin('');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const addDigit = (digit: string) => {
    if (pin.length < 6) setPin(prev => prev + digit);
  };

  const clear = () => setPin('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-dark tech-grid p-6 overflow-hidden">
      <div className="absolute inset-0 gold-glow-bg pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="gold-border p-[2px] rounded-[3rem] w-full max-w-lg relative z-10 brand-glow"
      >
        <div className="bg-surface-dark rounded-[2.9rem] p-8 flex flex-col items-center border border-white/5">
          <div className="w-20 h-20 bg-brand/10 border border-brand/30 rounded-3xl flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0">
            <Lock className="text-brand" size={40} />
          </div>
          
          <h1 className="text-3xl font-bold gold-text-gradient mb-2 tracking-tighter">{buildingName || 'EDI IA'}</h1>
          <p className="text-ink-muted text-xs mb-10 text-center uppercase tracking-[0.3em] font-semibold">Acesso Administrativo</p>
          
          <div className="flex gap-4 mb-12">
            {[...Array(4)].map((_, i) => (
              <motion.div 
                key={i} 
                animate={pin.length > i ? { scale: [1, 1.3, 1], rotate: [0, 10, 0] } : {}}
                className={cn(
                  "w-3 h-3 rounded-full border-2 transition-all duration-300",
                  pin.length > i ? "bg-brand border-brand shadow-[0_0_15px_#D4AF37]" : "border-white/10"
                )} 
              />
            ))}
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="text-red-400 text-[10px] mb-6 font-bold uppercase tracking-widest"
            >
              {error}
            </motion.p>
          )}

          <div className="grid grid-cols-4 gap-4 mb-8 w-full">
            {['1', '2', '3', 'C', '4', '5', '6', '0', '7', '8', '9', 'OK'].map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'C') clear();
                  else if (key === 'OK') handleSubmit();
                  else addDigit(key);
                }}
                disabled={loading}
                className={cn(
                  "h-12 w-12 rounded-full font-bold text-lg transition-all flex items-center justify-center mx-auto",
                  key === 'OK' ? "bg-brand text-black hover:scale-105" : 
                  key === 'C' ? "text-red-400/60 hover:text-red-400" : "text-white/40 hover:text-brand hover:bg-brand/5 border border-transparent hover:border-brand/20"
                )}
              >
                {key === 'OK' ? <ChevronRight size={20} /> : key}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 opacity-30">
             <div className="w-10 h-[1px] bg-brand" />
             <p className="text-[9px] text-ink uppercase tracking-[0.4em] font-bold">Condomínio Prime</p>
             <div className="w-10 h-[1px] bg-brand" />
          </div>
        </div>
      </motion.div>
      
      <div className="mt-12 text-[10px] text-ink-muted/30 uppercase tracking-[0.5em] font-bold">EDI IA • Luanda, AO</div>
    </div>
  );
};

export default LoginPage;
