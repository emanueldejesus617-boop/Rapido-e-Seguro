'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { HeaderInstallButton } from '@/components/InstallPwaButton';
import {
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  ShieldCheck,
  Menu,
  FileSpreadsheet,
  ArrowRight,
  Layers,
  Store,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { formatKz } from '@/lib/utils';
import { AuthUser, Posto, MonthlyReport } from '@/types';

// ─── Utilitários ────────────────────────────────────────────────────────────

function getMonthProgress(yearMonth: string): number {
  const now = new Date();
  const [year, month] = yearMonth.split('-').map(Number);
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  if (!isCurrentMonth) return 100;
  const daysInMonth = new Date(year, month, 0).getDate();
  return Math.round((now.getDate() / daysInMonth) * 100);
}

function isCurrentMonth(yearMonth: string): boolean {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return ym === yearMonth;
}

// ─── Componente Principal ────────────────────────────────────────────────────

function RelatorioMensalContent() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [postos, setPostos] = useState<Posto[]>([]);
  const [selectedPostoId, setSelectedPostoId] = useState('all');
  const [months, setMonths] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── Autenticação ──
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/login'); return; }
        const data = await res.json();
        setUser(data.user);
        if (data.user?.role !== 'admin') {
          setSelectedPostoId(data.user?.postoId || 'all');
        }
      } catch {
        router.push('/login');
      }
    };
    fetchAuth();
  }, [router]);

  // ── Buscar postos (apenas gerente) ──
  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetch('/api/postos')
      .then((r) => r.json())
      .then((d) => setPostos(d.postos || []))
      .catch(() => {});
  }, [user]);

  // ── Buscar meses ──
  const loadMonths = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedPostoId !== 'all') query.set('postoId', selectedPostoId);
      const res = await fetch(`/api/reports/monthly?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMonths(data.months || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadMonths();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedPostoId]);

  // ── KPIs globais (soma de todos os meses visíveis) ──
  const globalKpis = months.reduce(
    (acc, m) => ({
      totalVendas: acc.totalVendas + m.totalVendas,
      totalLucro: acc.totalLucro + m.totalLucro,
      totalBonus: acc.totalBonus + m.totalBonus,
      totalSaidas: acc.totalSaidas + m.totalSaidas,
      resultadoLiquido: acc.resultadoLiquido + m.resultadoLiquido,
      totalReports: acc.totalReports + m.reportCount,
    }),
    { totalVendas: 0, totalLucro: 0, totalBonus: 0, totalSaidas: 0, resultadoLiquido: 0, totalReports: 0 }
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pl-0 lg:pl-64">
      <Sidebar
        user={user}
        activeTab="relatorio-mensal"
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/80 bg-[#070b14]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 active:scale-95 transition"
            aria-label="Abrir Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
              <CalendarCheck size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Histórico Mensal</div>
              <div className="text-[9px] text-emerald-400 font-semibold uppercase">Rápido e Seguro</div>
            </div>
          </div>
        </div>
        <HeaderInstallButton />
      </header>

      <main className="min-h-screen pb-20">
        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-30 border-b border-slate-800 bg-[#070b14]/95 px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Arquivo de Relatórios Mensais
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Histórico Mensal Consolidado
              </h1>
              <p className="text-xs text-slate-400">
                Resumo financeiro por mês — vendas, lucros, saídas e resultado líquido
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HeaderInstallButton />
              <Link
                href="/historico"
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                <FileSpreadsheet size={14} className="text-emerald-400" />
                <span>Arquivo Diário</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 space-y-6">

          {/* Filtro de Posto (apenas gerente) */}
          {user?.role === 'admin' && (
            <div className="rounded-2xl border border-emerald-900/40 bg-[#091322] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                <Store size={15} className="text-emerald-400" />
                <span>Filtrar por Posto:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSelectedPostoId('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedPostoId === 'all'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Layers size={12} />
                  <span>Todos os Postos</span>
                </button>
                {postos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPostoId(p.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedPostoId === p.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Store size={12} />
                    <span>{p.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* KPIs Globais */}
          {!loading && months.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Total Vendas */}
              <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-[#0c1f17] to-[#080d19] p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Total Vendas</span>
                  <DollarSign size={14} className="text-emerald-400" />
                </div>
                <div className="text-lg font-extrabold text-emerald-400 font-mono">{formatKz(globalKpis.totalVendas)}</div>
                <p className="text-[10px] text-slate-500 mt-1">{globalKpis.totalReports} relatórios</p>
              </div>
              {/* Total Lucro */}
              <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-[#0d271d] to-[#080d19] p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Lucro</span>
                  <TrendingUp size={14} className="text-emerald-300" />
                </div>
                <div className="text-lg font-extrabold text-emerald-300 font-mono">{formatKz(globalKpis.totalLucro)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Soma de todos os meses</p>
              </div>
              {/* Bónus Aki */}
              <div className="rounded-2xl border border-yellow-800/40 bg-gradient-to-br from-[#1f1a06] to-[#080d19] p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Bónus Aki</span>
                  <Zap size={14} className="text-yellow-400" />
                </div>
                <div className="text-lg font-extrabold text-yellow-400 font-mono">{formatKz(globalKpis.totalBonus)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Bónus acumulado</p>
              </div>
              {/* Total Saídas */}
              <div className="rounded-2xl border border-rose-900/40 bg-gradient-to-br from-[#270d13] to-[#080d19] p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Saídas</span>
                  <TrendingDown size={14} className="text-rose-400" />
                </div>
                <div className="text-lg font-extrabold text-rose-400 font-mono">{formatKz(globalKpis.totalSaidas)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Despesas totais</p>
              </div>
              {/* Resultado Líquido */}
              <div className={`rounded-2xl border p-4 shadow-xl ${globalKpis.resultadoLiquido >= 0 ? 'border-emerald-500/40 bg-gradient-to-br from-[#0e3120] to-[#080d19]' : 'border-rose-500/40 bg-gradient-to-br from-[#330f16] to-[#080d19]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${globalKpis.resultadoLiquido >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>Resultado</span>
                  <ShieldCheck size={14} className={globalKpis.resultadoLiquido >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
                </div>
                <div className={`text-lg font-extrabold font-mono ${globalKpis.resultadoLiquido >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatKz(globalKpis.resultadoLiquido)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Líquido acumulado</p>
              </div>
            </div>
          )}

          {/* Lista de Meses */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarDays size={16} className="text-emerald-400" />
                  Arquivo por Mês
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {loading ? 'A carregar...' : `${months.length} ${months.length === 1 ? 'mês encontrado' : 'meses encontrados'}`}
                </p>
              </div>
              <BarChart3 size={18} className="text-slate-600" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <span className="text-xs text-slate-400">A calcular histórico mensal...</span>
              </div>
            ) : months.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                <CalendarCheck size={36} className="text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">Nenhum relatório encontrado</p>
                <p className="text-xs text-slate-500">Comece a registar relatórios diários para ver o histórico mensal aqui.</p>
                <Link
                  href="/?view=novo"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
                >
                  Criar Primeiro Relatório
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {months.map((m) => {
                  const isCurrent = isCurrentMonth(m.yearMonth);
                  const progress = getMonthProgress(m.yearMonth);
                  const lucroRatio = m.totalVendas > 0 ? (m.resultadoLiquido / m.totalVendas) * 100 : 0;
                  const isPositive = m.resultadoLiquido >= 0;

                  // Datas de início e fim do mês para filtrar o histórico diário
                  const [year, month] = m.yearMonth.split('-');
                  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
                  const startDate = `${m.yearMonth}-01`;
                  const endDate = `${m.yearMonth}-${String(daysInMonth).padStart(2, '0')}`;

                  return (
                    <div
                      key={m.yearMonth}
                      className={`p-4 sm:p-6 hover:bg-slate-800/20 transition-colors group ${isCurrent ? 'bg-emerald-950/10 border-l-2 border-l-emerald-500' : ''}`}
                    >
                      {/* Cabeçalho do card do mês */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-black ${isCurrent ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                            {m.yearMonth.split('-')[1]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-bold text-sm ${isCurrent ? 'text-emerald-300' : 'text-white'}`}>
                                {m.label}
                              </h3>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-600/50 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Mês Atual
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {m.closedCount === m.reportCount && m.reportCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                  <CheckCircle2 size={11} /> {m.reportCount} fechados
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                                  <Clock size={11} /> {m.closedCount}/{m.reportCount} fechados
                                </span>
                              )}
                              {m.postos.length > 0 && (
                                <span className="text-[10px] text-slate-500">
                                  • {m.postos.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Resultado Líquido em destaque */}
                        <div className={`flex flex-col items-end shrink-0 rounded-xl px-4 py-2 border ${isPositive ? 'bg-emerald-950/40 border-emerald-700/40' : 'bg-rose-950/40 border-rose-700/40'}`}>
                          <span className="text-[10px] font-semibold text-slate-400">Resultado Líquido</span>
                          <span className={`text-lg font-extrabold font-mono ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {isPositive ? '+' : ''}{formatKz(m.resultadoLiquido)}
                          </span>
                        </div>
                      </div>

                      {/* Grid de KPIs do mês */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Vendas</div>
                          <div className="text-sm font-bold text-emerald-400 font-mono">{formatKz(m.totalVendas)}</div>
                        </div>
                        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Lucro (+Taxa)</div>
                          <div className="text-sm font-bold text-emerald-300 font-mono">{formatKz(m.totalLucro)}</div>
                        </div>
                        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Bónus Aki</div>
                          <div className="text-sm font-bold text-yellow-400 font-mono">
                            {m.totalBonus > 0 ? `+${formatKz(m.totalBonus)}` : <span className="text-slate-600">—</span>}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Saídas</div>
                          <div className="text-sm font-bold text-rose-400 font-mono">{formatKz(m.totalSaidas)}</div>
                        </div>
                      </div>

                      {/* Barra de progresso do mês (se for o mês atual) + margem de lucro */}
                      <div className="space-y-2 mb-4">
                        {/* Margem de Resultado */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Margem de resultado sobre vendas</span>
                          <span className={`font-bold ${lucroRatio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {lucroRatio.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isPositive ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                            style={{ width: `${Math.min(Math.abs(lucroRatio), 100)}%` }}
                          />
                        </div>

                        {/* Progresso do mês atual */}
                        {isCurrent && (
                          <>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                              <span>Progresso do mês atual</span>
                              <span className="font-bold text-emerald-400">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-800 to-emerald-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/historico?startDate=${startDate}&endDate=${endDate}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                        >
                          <FileSpreadsheet size={13} className="text-emerald-400" />
                          <span>Ver Relatórios Diários</span>
                          <ChevronRight size={12} className="text-slate-500" />
                        </Link>
                        <Link
                          href={`/?view=dashboard&period=monthly`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/50 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:text-white transition"
                        >
                          <BarChart3 size={13} />
                          <span>Painel do Mês</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RelatorioMensalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-xs text-slate-400">A carregar histórico mensal...</span>
          </div>
        </div>
      }
    >
      <RelatorioMensalContent />
    </Suspense>
  );
}
