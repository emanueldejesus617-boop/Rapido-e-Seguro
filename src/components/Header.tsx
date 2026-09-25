'use client';

import React, { useEffect, useState } from 'react';
import { PlusCircle, MinusCircle, Clock, Calendar, Sparkles } from 'lucide-react';
import { formatDatePt, getTodayDateString } from '@/lib/utils';
import Link from 'next/link';
import { HeaderInstallButton } from '@/components/InstallPwaButton';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenQuickSale?: () => void;
  onOpenQuickExpense?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenQuickSale,
  onOpenQuickExpense,
}) => {
  const [time, setTime] = useState<string>('');
  const today = getTodayDateString();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex flex-col justify-between gap-4 border-b border-slate-800 bg-[#090d16]/90 px-8 py-4 backdrop-blur-md md:flex-row md:items-center">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Date & Time Widget */}
        <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
          <Calendar size={14} className="text-emerald-400" />
          <span>{formatDatePt(today)}</span>
          <span className="text-slate-600">|</span>
          <Clock size={14} className="text-cyan-400" />
          <span className="font-mono text-emerald-300 font-medium">{time || '--:--:--'}</span>
        </div>

        {/* Botão de Download / Instalação do App */}
        <HeaderInstallButton />

        {/* Quick action buttons */}
        <Link
          href="/vendas"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-900/40 transition-all duration-200 hover:bg-emerald-500 hover:shadow-emerald-900/60"
        >
          <PlusCircle size={15} />
          <span>+ Registar Venda</span>
        </Link>

        <Link
          href="/saidas"
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-300 transition-all duration-200 hover:bg-rose-900/40 hover:text-rose-200"
        >
          <MinusCircle size={15} />
          <span>- Registar Saída</span>
        </Link>
      </div>
    </header>
  );
};
