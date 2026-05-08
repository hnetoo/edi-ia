import React from 'react';
import { motion } from 'framer-motion';

export const FormField = ({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest block">{label}</label>
    {children}
    {error && (
      <motion.p 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[10px] text-red-400 font-medium"
      >
        {error}
      </motion.p>
    )}
  </div>
);
