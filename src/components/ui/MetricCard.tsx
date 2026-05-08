import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MetricCard = ({ label, value, trend, icon: Icon }: { label: string, value: string, trend?: string, icon: any }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 flex flex-col gap-4 relative group hover:border-brand/30 transition-colors"
  >
    <div className="flex justify-between items-start">
      <div className="p-3 rounded-xl bg-brand/10 text-brand">
        <Icon size={24} />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-mono px-2 py-1 rounded-md",
          trend.startsWith('+') ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
        )}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-ink-muted text-xs uppercase tracking-widest font-semibold">{label}</p>
      <h3 className="text-2xl font-mono mt-1 tracking-tight text-white">{value}</h3>
    </div>
    <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-3xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.div>
);
