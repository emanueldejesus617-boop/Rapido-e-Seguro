'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  History,
  LogOut,
  ShieldCheck,
  UserCheck,
  Zap,
  TrendingUp,
  FilePlus2,
  CalendarCheck,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { AuthUser } from '@/types';
import { SidebarInstallCard } from '@/components/InstallPwaButton';

interface SidebarProps {
  user: AuthUser | null;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPeriod = searchParams.get('period') || 'last_7_days';
  const currentView = searchParams.get('view') || (activeTab || 'dashboard');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Painel Geral',
      href: '/?view=dashboard',
      icon: LayoutDashboard,
      description: 'Visão executiva e métricas',
      isTab: true,
      color: 'emerald',
    },
    {
      id: 'novo',
      label: 'Começar Relatório',
      href: '/?view=novo',
      icon: FilePlus2,
      description: 'Lançamento rápido do dia',
      isTab: true,
      highlight: true,
      color: 'emerald',
    },
    {
      id: 'weekly',
      label: 'Relatório Semanal',
      href: '/?view=dashboard&period=weekly',
      icon: CalendarRange,
      description: 'Fecho & métricas da semana',
      isTab: true,
      color: 'emerald',
    },
    {
      id: 'monthly',
      label: 'Relatório Mensal',
      href: '/?view=dashboard&period=monthly',
      icon: CalendarCheck,
      description: 'Consolidado do mês',
      isTab: true,
      color: 'emerald',
    },
    {
      id: 'historico',
      label: 'Arquivo & Histórico',
      href: '/historico',
      icon: History,
      description: 'Consultas & auditoria',
      isTab: false,
      color: 'slate',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container (Responsive: Hidden on Mobile unless isOpenMobile is true, always visible on lg) */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 lg:w-64 flex-col justify-between border-r border-slate-800/80 bg-[#070b14] text-slate-200 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex flex-col h-[calc(100vh-80px)] overflow-y-auto">
          {/* Brand Header & Mobile Close Button */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <Link
              href="/"
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center gap-3 group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40 group-hover:scale-105 transition-all">
                <Zap size={22} className="fill-white" />
              </div>
              <div>
                <div className="text-sm font-extrabold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  Rápido e Seguro
                </div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gestão de Vendas
                </div>
              </div>
            </Link>

            {/* Close Button on Mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tagline / System Status */}
          <div className="mt-3 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-2.5 text-[11px] text-emerald-300 leading-snug flex items-center gap-2">
            <TrendingUp size={14} className="shrink-0 text-emerald-400" />
            <span>Fecho de caixa e relatórios diários</span>
          </div>

          {/* Separator */}
          <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

          {/* Section Label */}
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Navegação & Relatórios
          </div>

          {/* Pinned Tabs & Navigation links */}
          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              let isActive = false;

              if (pathname === '/historico') {
                isActive = item.href === '/historico';
              } else if (pathname === '/') {
                if (item.id === 'novo') {
                  isActive = currentView === 'novo';
                } else if (item.id === 'weekly') {
                  isActive = currentView === 'dashboard' && currentPeriod === 'weekly';
                } else if (item.id === 'monthly') {
                  isActive = currentView === 'dashboard' && currentPeriod === 'monthly';
                } else if (item.id === 'dashboard') {
                  isActive = currentView === 'dashboard' && currentPeriod !== 'weekly' && currentPeriod !== 'monthly';
                }
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (onSelectTab) onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-semibold transition-all ${
                    item.highlight && !isActive
                      ? 'bg-emerald-600/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/20'
                      : ''
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/60 border border-emerald-400/40 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white shadow-inner'
                        : item.highlight
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon size={17} />
                  </div>
                  <div className="truncate">
                    <div className="truncate text-white font-medium">{item.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100 font-normal' : 'text-slate-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Banner de Instalação do App */}
          <div className="mt-4 pt-2">
            <SidebarInstallCard />
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                  user?.role === 'admin'
                    ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                {user?.role === 'admin' ? <ShieldCheck size={16} /> : <UserCheck size={16} />}
              </div>
              <div className="truncate">
                <div className="truncate text-xs font-semibold text-white">
                  {user?.name || 'Operador'}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      user?.role === 'admin' ? 'bg-emerald-400' : 'bg-emerald-500'
                    }`}
                  />
                  {user?.role === 'admin'
                    ? 'Gerente • Todos os Postos'
                    : user?.postoNome
                    ? `${user.postoNome} • Operador`
                    : 'Operador'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Terminar Sessão"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-950/60 hover:text-rose-400 hover:border hover:border-rose-800/40"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
