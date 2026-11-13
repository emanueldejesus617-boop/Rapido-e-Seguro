'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
  ChevronDown,
  CalendarDays,
  CheckCircle2,
  Clock,
  BarChart3,
  Download,
  Printer,
  Eye,
  Search,
  Filter,
  AlertCircle,
  PieChart,
  CreditCard,
  Smartphone,
  Tv,
  Coins,
} from 'lucide-react';
import { formatKz, formatDatePt } from '@/lib/utils';
import { AuthUser, Posto, MonthlyReport, DailyReport, MonthlyChannelMetric } from '@/types';
import {
  downloadMonthlyReportPdf,
  openMonthlyReportPdfPrint,
  downloadDailyReportPdf,
} from '@/lib/monthlyPdfGenerator';

// ─── Metadados Visuais de Canais ───────────────────────────────────────────

const CHANNEL_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; badgeBg: string; border: string; bar: string }
> = {
  aki: {
    label: 'AKI',
    icon: <Zap size={14} className="text-yellow-400" />,
    color: 'text-yellow-400',
    badgeBg: 'bg-yellow-950/40 text-yellow-300 border-yellow-700/50',
    border: 'border-yellow-900/30',
    bar: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
  },
  afrivendas: {
    label: 'Afrivendas',
    icon: <DollarSign size={14} className="text-cyan-400" />,
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/40 text-cyan-300 border-cyan-700/50',
    border: 'border-cyan-900/30',
    bar: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
  },
  zap: {
    label: 'ZAP',
    icon: <Tv size={14} className="text-orange-400" />,
    color: 'text-orange-400',
    badgeBg: 'bg-orange-950/40 text-orange-300 border-orange-700/50',
    border: 'border-orange-900/30',
    bar: 'bg-gradient-to-r from-orange-600 to-orange-400',
  },
  unitel: {
    label: 'Unitel',
    icon: <Smartphone size={14} className="text-rose-400" />,
    color: 'text-rose-400',
    badgeBg: 'bg-rose-950/40 text-rose-300 border-rose-700/50',
    border: 'border-rose-900/30',
    bar: 'bg-gradient-to-r from-rose-600 to-rose-400',
  },
  cartoes: {
    label: 'Cartões',
    icon: <CreditCard size={14} className="text-indigo-400" />,
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-950/40 text-indigo-300 border-indigo-700/50',
    border: 'border-indigo-900/30',
    bar: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
  },
  chips: {
    label: 'Chips',
    icon: <Coins size={14} className="text-sky-400" />,
    color: 'text-sky-400',
    badgeBg: 'bg-sky-950/40 text-sky-300 border-sky-700/50',
    border: 'border-sky-900/30',
    bar: 'bg-gradient-to-r from-sky-600 to-sky-400',
  },
};

// ─── Utilitários de Data ───────────────────────────────────────────────────

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

  // Estados de navegação e filtros
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados de expansão dos relatórios de meses passados
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [monthReports, setMonthReports] = useState<Record<string, DailyReport[]>>({});
  const [loadingMonthReports, setLoadingMonthReports] = useState<Record<string, boolean>>({});

  // Controle de exibição de canais (cards vs tabela)
  const [channelViewMode, setChannelViewMode] = useState<Record<string, 'cards' | 'table'>>({});

  // Estados de download de PDF
  const [downloadingPdf, setDownloadingPdf] = useState<Record<string, boolean>>({});
  const [printingPdf, setPrintingPdf] = useState<Record<string, boolean>>({});

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

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
      showFeedback('error', 'Falha ao carregar relatórios mensais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadMonths();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedPostoId]);

  // Anos disponíveis nos relatórios
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    months.forEach((m) => {
      const y = m.yearMonth.split('-')[0];
      if (y) years.add(y);
    });
    years.add(String(new Date().getFullYear()));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [months]);

  // Meses filtrados por ano e busca
  const filteredMonths = useMemo(() => {
    return months.filter((m) => {
      const [y] = m.yearMonth.split('-');
      if (selectedYear !== 'all' && y !== selectedYear) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLabel = m.label.toLowerCase().includes(q);
        const matchesYearMonth = m.yearMonth.includes(q);
        const matchesPosto = m.postos.some((p) => p.toLowerCase().includes(q));
        if (!matchesLabel && !matchesYearMonth && !matchesPosto) return false;
      }
      return true;
    });
  }, [months, selectedYear, searchQuery]);

  // ── KPIs Globais dos Meses Selecionados ──
  const globalKpis = useMemo(() => {
    return filteredMonths.reduce(
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
  }, [filteredMonths]);

  // ── Expandir e Carregar os Fechos Diários de um Mês ──
  const toggleExpandMonth = async (m: MonthlyReport) => {
    const ym = m.yearMonth;
    if (expandedMonth === ym) {
      setExpandedMonth(null);
      return;
    }

    setExpandedMonth(ym);

    if (monthReports[ym]) return;

    setLoadingMonthReports((prev) => ({ ...prev, [ym]: true }));
    try {
      const [year, month] = ym.split('-');
      const daysInMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
      const startDate = `${ym}-01`;
      const endDate = `${ym}-${String(daysInMonth).padStart(2, '0')}`;

      const query = new URLSearchParams({ startDate, endDate });
      if (selectedPostoId !== 'all') {
        query.set('postoId', selectedPostoId);
      }

      const res = await fetch(`/api/reports?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMonthReports((prev) => ({ ...prev, [ym]: data.reports || [] }));
      }
    } catch (e) {
      console.error(e);
      showFeedback('error', `Não foi possível carregar os fechos diários de ${m.label}`);
    } finally {
      setLoadingMonthReports((prev) => ({ ...prev, [ym]: false }));
    }
  };

  // ── Download em PDF do Relatório Mensal com Métricas por Canal ──
  const handleDownloadMonthlyPdf = async (m: MonthlyReport) => {
    setDownloadingPdf((prev) => ({ ...prev, [m.yearMonth]: true }));
    try {
      const postoNome =
        selectedPostoId === 'all'
          ? 'Todos os Postos'
          : postos.find((p) => p.id === selectedPostoId)?.nome || user?.postoNome || 'Posto Principal';

      await downloadMonthlyReportPdf({
        month: m,
        userName: user?.name,
        postoName: postoNome,
        postoId: selectedPostoId,
      });

      showFeedback('success', `Relatório em PDF de ${m.label} com métricas de todos os canais descarregado com sucesso!`);
    } catch (error) {
      console.error(error);
      showFeedback('error', `Erro ao gerar PDF de ${m.label}.`);
    } finally {
      setDownloadingPdf((prev) => ({ ...prev, [m.yearMonth]: false }));
    }
  };

  // ── Imprimir / Visualizar PDF do Relatório Mensal ──
  const handlePrintMonthlyPdf = async (m: MonthlyReport) => {
    setPrintingPdf((prev) => ({ ...prev, [m.yearMonth]: true }));
    try {
      const postoNome =
        selectedPostoId === 'all'
          ? 'Todos os Postos'
          : postos.find((p) => p.id === selectedPostoId)?.nome || user?.postoNome || 'Posto Principal';

      await openMonthlyReportPdfPrint({
        month: m,
        userName: user?.name,
        postoName: postoNome,
        postoId: selectedPostoId,
      });
    } catch (error) {
      console.error(error);
      showFeedback('error', `Erro ao preparar visualização de ${m.label}.`);
    } finally {
      setPrintingPdf((prev) => ({ ...prev, [m.yearMonth]: false }));
    }
  };

  // ── Download do PDF de um Dia Individual ──
  const handleDownloadDayPdf = (rep: DailyReport) => {
    try {
      downloadDailyReportPdf(rep, user?.name);
      showFeedback('success', `PDF do dia ${formatDatePt(rep.data)} transferido!`);
    } catch (error) {
      console.error(error);
      showFeedback('error', 'Erro ao transferir PDF do fecho diário.');
    }
  };

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white font-bold">
              <CalendarCheck size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Histórico Mensal</div>
              <div className="text-[9px] text-sky-400 font-semibold uppercase">Rápido e Seguro</div>
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
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                Arquivo de Relatórios Mensais
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Histórico Mensal Consolidado
              </h1>
              <p className="text-xs text-slate-400">
                Métricas completas por canal de venda (AKI, Afrivendas, ZAP, Unitel, Cartões, Chips) com exportação em PDF
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HeaderInstallButton />
              <Link
                href="/historico"
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                <FileSpreadsheet size={14} className="text-sky-400" />
                <span>Arquivo Diário Geral</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 space-y-6">

          {/* Toast / Feedback */}
          {feedback && (
            <div
              className={`flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-semibold shadow-lg transition-all animate-fadeIn ${
                feedback.type === 'success'
                  ? 'border border-sky-800 bg-sky-950/90 text-sky-300'
                  : 'border border-rose-800 bg-rose-950/90 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Barra de Filtros e Busca */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-4 sm:p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Filtro de Ano */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Filter size={14} className="text-sky-400" />
                  Ano:
                </span>
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    selectedYear === 'all'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Todos os Anos
                </button>
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      selectedYear === yr
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              {/* Campo de Busca Rápida por Mês */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar mês ou posto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#070b14] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            {/* Filtro de Posto (apenas gerente) */}
            {user?.role === 'admin' && (
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                  <Store size={14} className="text-sky-400" />
                  <span>Filtrar por Posto:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setSelectedPostoId('all')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedPostoId === 'all'
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Layers size={11} />
                    <span>Todos os Postos</span>
                  </button>
                  {postos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPostoId(p.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                        selectedPostoId === p.id
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Store size={11} />
                      <span>{p.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* KPIs Globais dos Meses Selecionados */}
          {!loading && filteredMonths.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="rounded-2xl border border-sky-900/40 bg-gradient-to-br from-[#040d1a] to-[#080d19] p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Total Vendas</span>
                  <DollarSign size={14} className="text-sky-400" />
                </div>
                <div className="text-lg font-extrabold text-sky-400 font-mono">{formatKz(globalKpis.totalVendas)}</div>
                <p className="text-[10px] text-slate-500 mt-1">{globalKpis.totalReports} relatórios em {filteredMonths.length} {filteredMonths.length === 1 ? 'mês' : 'meses'}</p>
              </div>

              <div className="rounded-2xl border border-sky-800/40 bg-gradient-to-br from-[#040d1a] to-[#080d19] p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Lucro (+Taxas)</span>
                  <TrendingUp size={14} className="text-sky-300" />
                </div>
                <div className="text-lg font-extrabold text-sky-300 font-mono">{formatKz(globalKpis.totalLucro)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Taxas de todos os canais</p>
              </div>

              <div className="rounded-2xl border border-yellow-800/40 bg-gradient-to-br from-[#1f1a06] to-[#080d19] p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Bónus Aki</span>
                  <Zap size={14} className="text-yellow-400" />
                </div>
                <div className="text-lg font-extrabold text-yellow-400 font-mono">{formatKz(globalKpis.totalBonus)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Bónus acumulado</p>
              </div>

              <div className="rounded-2xl border border-rose-900/40 bg-gradient-to-br from-[#270d13] to-[#080d19] p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Saídas</span>
                  <TrendingDown size={14} className="text-rose-400" />
                </div>
                <div className="text-lg font-extrabold text-rose-400 font-mono">{formatKz(globalKpis.totalSaidas)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Despesas totais</p>
              </div>

              <div className={`rounded-2xl border p-4 shadow-xl ${globalKpis.resultadoLiquido >= 0 ? 'border-sky-500/40 bg-gradient-to-br from-[#040d1a] to-[#080d19]' : 'border-rose-500/40 bg-gradient-to-br from-[#330f16] to-[#080d19]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${globalKpis.resultadoLiquido >= 0 ? 'text-sky-300' : 'text-rose-300'}`}>Resultado Líquido</span>
                  <ShieldCheck size={14} className={globalKpis.resultadoLiquido >= 0 ? 'text-sky-300' : 'text-rose-300'} />
                </div>
                <div className={`text-lg font-extrabold font-mono ${globalKpis.resultadoLiquido >= 0 ? 'text-sky-300' : 'text-rose-300'}`}>{formatKz(globalKpis.resultadoLiquido)}</div>
                <p className="text-[10px] text-slate-500 mt-1">Vendas + Taxas + Aki - Saídas</p>
              </div>
            </div>
          )}

          {/* Lista de Meses com Métricas de Canais */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarDays size={16} className="text-sky-400" />
                  Arquivo de Meses e Desempenho por Canal
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {loading
                    ? 'A carregar relatórios...'
                    : `${filteredMonths.length} ${filteredMonths.length === 1 ? 'mês registado' : 'meses registados'}`}
                </p>
              </div>
              <BarChart3 size={18} className="text-slate-600" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                <span className="text-xs text-slate-400">A compilar relatórios e métricas de canais...</span>
              </div>
            ) : filteredMonths.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                <CalendarCheck size={36} className="text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">Nenhum mês encontrado para os filtros selecionados</p>
                <p className="text-xs text-slate-500">Tente ajustar o ano ou o termo de pesquisa acima.</p>
                {selectedYear !== 'all' || searchQuery ? (
                  <button
                    onClick={() => { setSelectedYear('all'); setSearchQuery(''); }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                  >
                    Limpar Filtros
                  </button>
                ) : (
                  <Link
                    href="/?view=novo"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
                  >
                    Criar Primeiro Relatório
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {filteredMonths.map((m) => {
                  const isCurrent = isCurrentMonth(m.yearMonth);
                  const progress = getMonthProgress(m.yearMonth);
                  const lucroRatio = m.totalVendas > 0 ? (m.resultadoLiquido / m.totalVendas) * 100 : 0;
                  const isPositive = m.resultadoLiquido >= 0;
                  const isExpanded = expandedMonth === m.yearMonth;
                  const isDownloading = downloadingPdf[m.yearMonth] || false;
                  const isPrinting = printingPdf[m.yearMonth] || false;
                  const daysList = monthReports[m.yearMonth] || [];
                  const isLoadingDays = loadingMonthReports[m.yearMonth] || false;
                  const viewMode = channelViewMode[m.yearMonth] || 'cards';

                  const [year, month] = m.yearMonth.split('-');
                  const daysInMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
                  const startDate = `${m.yearMonth}-01`;
                  const endDate = `${m.yearMonth}-${String(daysInMonth).padStart(2, '0')}`;

                  const channelsList: MonthlyChannelMetric[] = m.channels || [];

                  return (
                    <div
                      key={m.yearMonth}
                      className={`p-4 sm:p-6 transition-colors ${
                        isCurrent
                          ? 'bg-sky-950/15 border-l-4 border-l-sky-500'
                          : 'hover:bg-slate-800/10'
                      }`}
                    >
                      {/* Cabeçalho do Mês */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black shadow-md ${
                              isCurrent
                                ? 'bg-sky-600/20 border-sky-500/50 text-sky-300'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300'
                            }`}
                          >
                            {m.yearMonth.split('-')[1]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-bold text-base ${isCurrent ? 'text-sky-300' : 'text-white'}`}>
                                {m.label}
                              </h3>
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-950 border border-sky-600/50 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                                  Mês Atual
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                  Mês Passado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {m.closedCount === m.reportCount && m.reportCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 font-semibold">
                                  <CheckCircle2 size={11} /> {m.reportCount} fechados
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                                  <Clock size={11} /> {m.closedCount}/{m.reportCount} fechados
                                </span>
                              )}
                              {m.postos.length > 0 && (
                                <span className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-none">
                                  • {m.postos.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Resultado Líquido em Destaque */}
                        <div
                          className={`flex flex-col items-end shrink-0 rounded-2xl px-4 py-2 border shadow-lg ${
                            isPositive
                              ? 'bg-sky-950/40 border-sky-700/50'
                              : 'bg-rose-950/40 border-rose-700/50'
                          }`}
                        >
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Resultado Líquido
                          </span>
                          <span
                            className={`text-lg sm:text-xl font-black font-mono ${
                              isPositive ? 'text-sky-300' : 'text-rose-300'
                            }`}
                          >
                            {isPositive ? '+' : ''}{formatKz(m.resultadoLiquido)}
                          </span>
                        </div>
                      </div>

                      {/* Grid de 4 KPIs Resumidos */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
                        <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-3">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                            Vendas Brutas
                          </div>
                          <div className="text-sm font-bold text-sky-400 font-mono">
                            {formatKz(m.totalVendas)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-3">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                            Lucro (+Taxas)
                          </div>
                          <div className="text-sm font-bold text-sky-300 font-mono">
                            {formatKz(m.totalLucro)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-3">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                            Bónus Aki
                          </div>
                          <div className="text-sm font-bold text-yellow-400 font-mono">
                            {m.totalBonus > 0 ? `+${formatKz(m.totalBonus)}` : <span className="text-slate-600">—</span>}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-3">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                            Total Saídas
                          </div>
                          <div className="text-sm font-bold text-rose-400 font-mono">
                            {formatKz(m.totalSaidas)}
                          </div>
                        </div>
                      </div>

                      {/* Barra de Progresso / Margem Líquida */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Margem de resultado líquido sobre vendas</span>
                          <span className={`font-bold ${lucroRatio >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                            {lucroRatio.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800/90 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isPositive
                                ? 'bg-gradient-to-r from-sky-600 to-sky-400'
                                : 'bg-gradient-to-r from-rose-600 to-rose-400'
                            }`}
                            style={{ width: `${Math.min(Math.abs(lucroRatio), 100)}%` }}
                          />
                        </div>

                        {isCurrent && (
                          <>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                              <span>Progresso temporal do mês atual</span>
                              <span className="font-bold text-sky-400">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-sky-800 to-sky-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* ── PAINEL: MÉTRICAS CONSOLIDADAS POR CANAL DE VENDA NO MÊS ── */}
                      <div className="my-5 rounded-2xl border border-slate-800/90 bg-[#091120] p-4 sm:p-5 shadow-inner space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/70">
                          <div>
                            <div className="flex items-center gap-2">
                              <PieChart size={15} className="text-sky-400" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Métricas por Canal de Venda ({m.label})
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Desempenho discriminado das vendas, taxas (+Lucro) e participação em {m.label}
                            </p>
                          </div>

                          {/* Alternador de visualização: Cards vs Tabela */}
                          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setChannelViewMode((prev) => ({ ...prev, [m.yearMonth]: 'cards' }))}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                                viewMode === 'cards'
                                  ? 'bg-sky-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Cards
                            </button>
                            <button
                              type="button"
                              onClick={() => setChannelViewMode((prev) => ({ ...prev, [m.yearMonth]: 'table' }))}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                                viewMode === 'table'
                                  ? 'bg-sky-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Tabela
                            </button>
                          </div>
                        </div>

                        {/* Visualização em CARDS por Canal */}
                        {viewMode === 'cards' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {channelsList.map((ch) => {
                              const cfg = CHANNEL_CONFIG[ch.canal] || {
                                label: ch.nome,
                                icon: <Coins size={14} className="text-sky-400" />,
                                color: 'text-sky-400',
                                badgeBg: 'bg-sky-950/40 text-sky-300 border-sky-700/50',
                                border: 'border-slate-800',
                                bar: 'bg-sky-500',
                              };

                              return (
                                <div
                                  key={ch.canal}
                                  className={`rounded-xl border ${cfg.border} bg-slate-900/80 p-3.5 space-y-2.5 shadow-md`}
                                >
                                  {/* Topo do Card do Canal */}
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${cfg.badgeBg}`}
                                    >
                                      {cfg.icon}
                                      <span>{cfg.label}</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                                      {ch.participacaoVendas.toFixed(1)}% do mês
                                    </span>
                                  </div>

                                  {/* Valores do Canal */}
                                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                                    <div>
                                      <div className="text-[10px] text-slate-500 font-medium uppercase">
                                        Vendido
                                      </div>
                                      <div className="text-xs sm:text-sm font-bold text-white font-mono">
                                        {formatKz(ch.totalVendido)}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-500 font-medium uppercase">
                                        + Taxa / Lucro
                                      </div>
                                      <div className="text-xs sm:text-sm font-bold text-sky-400 font-mono">
                                        +{formatKz(ch.totalTaxa)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subtotal Arrecadado */}
                                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/40">
                                    <span className="text-slate-400">Arrecadado:</span>
                                    <span className="font-bold text-sky-300 font-mono">
                                      {formatKz(ch.totalArrecadado)}
                                    </span>
                                  </div>

                                  {/* Barra de Progresso do Canal */}
                                  <div className="space-y-1">
                                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${cfg.bar}`}
                                        style={{ width: `${Math.min(ch.participacaoVendas, 100)}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] text-slate-500">
                                      <span>Operações:</span>
                                      <span>{ch.operacoesCount} dias com vendas</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Visualização em TABELA Comparativa */
                          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                            <table className="w-full text-left text-xs min-w-[600px]">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold bg-slate-900/60">
                                  <th className="p-3">Canal de Venda</th>
                                  <th className="p-3 text-right">Vendas Brutas</th>
                                  <th className="p-3 text-right">Taxa (+Lucro)</th>
                                  <th className="p-3 text-right">Total Arrecadado</th>
                                  <th className="p-3 text-center">Participação (%)</th>
                                  <th className="p-3 text-center">Fechos com Venda</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {channelsList.map((ch) => {
                                  const cfg = CHANNEL_CONFIG[ch.canal];
                                  return (
                                    <tr key={ch.canal} className="hover:bg-slate-800/20 transition-colors">
                                      <td className="p-3 font-bold text-white flex items-center gap-2">
                                        {cfg?.icon}
                                        <span>{cfg?.label || ch.nome}</span>
                                      </td>
                                      <td className="p-3 text-right font-mono font-bold text-white">
                                        {formatKz(ch.totalVendido)}
                                      </td>
                                      <td className="p-3 text-right font-mono font-bold text-sky-400">
                                        +{formatKz(ch.totalTaxa)}
                                      </td>
                                      <td className="p-3 text-right font-mono font-bold text-sky-300">
                                        {formatKz(ch.totalArrecadado)}
                                      </td>
                                      <td className="p-3 text-center font-mono font-semibold text-slate-300">
                                        {ch.participacaoVendas.toFixed(1)}%
                                      </td>
                                      <td className="p-3 text-center text-slate-400">
                                        {ch.operacoesCount} fechos
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-slate-700 bg-slate-900/80 font-bold text-white">
                                  <td className="p-3 uppercase">SUBTOTAL GERAL</td>
                                  <td className="p-3 text-right font-mono text-sky-400">
                                    {formatKz(m.totalVendas)}
                                  </td>
                                  <td className="p-3 text-right font-mono text-sky-300">
                                    +{formatKz(m.totalLucro)}
                                  </td>
                                  <td className="p-3 text-right font-mono text-sky-200">
                                    {formatKz(m.totalVendas + m.totalLucro)}
                                  </td>
                                  <td className="p-3 text-center font-mono">100.0%</td>
                                  <td className="p-3 text-center text-slate-400">{m.reportCount} fechos</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}

                        {/* Despesas por Categoria do Mês */}
                        {m.expensesByCategory && m.expensesByCategory.length > 0 && (
                          <div className="pt-3 border-t border-slate-800/70">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Distribuição de Saídas por Categoria ({m.label})
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {m.expensesByCategory.map((exp) => (
                                <div
                                  key={exp.categoria}
                                  className="rounded-xl border border-rose-950/50 bg-rose-950/20 p-2.5"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                    <span className="font-semibold text-rose-300">{exp.nome}</span>
                                    <span className="font-mono text-rose-400 font-bold">
                                      {exp.participacaoSaidas.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-rose-300 font-mono">
                                    {formatKz(exp.total)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Barra de Ações: Baixar PDF, Imprimir, Ver Relatórios do Mês */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
                        {/* BOTÃO PRINCIPAL: BAIXAR PDF MENSAL COM MÉTRICAS DE CANAL */}
                        <button
                          type="button"
                          onClick={() => handleDownloadMonthlyPdf(m)}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-900/60/60 transition disabled:opacity-60"
                        >
                          {isDownloading ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Download size={14} />
                          )}
                          <span>
                            {isDownloading
                              ? 'A gerar PDF com métricas...'
                              : 'Baixar Relatório Mensal em PDF'}
                          </span>
                        </button>

                        {/* BOTÃO SECUNDÁRIO: IMPRIMIR / VISUALIZAR PDF */}
                        <button
                          type="button"
                          onClick={() => handlePrintMonthlyPdf(m)}
                          disabled={isPrinting}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white active:scale-95 transition disabled:opacity-60"
                          title="Visualizar documento e imprimir"
                        >
                          {isPrinting ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
                          ) : (
                            <Printer size={13} className="text-slate-400" />
                          )}
                          <span>Imprimir / Ver</span>
                        </button>

                        {/* BOTÃO EXPANSÍVEL: VER RELATÓRIOS DO MÊS */}
                        <button
                          type="button"
                          onClick={() => toggleExpandMonth(m)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition active:scale-95 border ${
                            isExpanded
                              ? 'bg-sky-950/60 border-sky-600 text-sky-300'
                              : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          <FileSpreadsheet size={13} className="text-sky-400" />
                          <span>
                            {isExpanded
                              ? 'Recolher Fechos do Mês'
                              : `Ver Fechos Diários do Mês (${m.reportCount})`}
                          </span>
                          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>

                        {/* LINK PARA ARQUIVO DIÁRIO COMPLETO */}
                        <Link
                          href={`/historico?startDate=${startDate}&endDate=${endDate}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <span>Abrir no Arquivo Diário</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>

                      {/* PAINEL EXPANSÍVEL: LISTA DE FECHOS DIÁRIOS DESTE MÊS */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-800/80 animate-fadeIn">
                          <div className="rounded-2xl border border-slate-800 bg-[#091120] overflow-hidden">
                            <div className="p-3.5 sm:p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CalendarCheck size={15} className="text-sky-400" />
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                  Fechos Diários de {m.label} ({daysList.length} dias registados)
                                </h4>
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">
                                Clique para ver detalhes ou descarregar o PDF do fecho
                              </span>
                            </div>

                            {isLoadingDays ? (
                              <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                                <span className="text-xs text-slate-400">A carregar fechos de {m.label}...</span>
                              </div>
                            ) : daysList.length === 0 ? (
                              <div className="p-8 text-center text-xs text-slate-400">
                                Nenhum fecho diário registado neste mês.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs min-w-[700px]">
                                  <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-semibold">
                                      <th className="p-3">Data</th>
                                      <th className="p-3">Posto / Operador</th>
                                      <th className="p-3 text-right">Vendas Brutas</th>
                                      <th className="p-3 text-right">Lucro (+Taxas)</th>
                                      <th className="p-3 text-right">Bónus Aki</th>
                                      <th className="p-3 text-right">Saídas</th>
                                      <th className="p-3 text-right">Resultado Líquido</th>
                                      <th className="p-3 text-center">Status</th>
                                      <th className="p-3 text-center">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60">
                                    {daysList.map((rep) => {
                                      const dayPositive = (rep.total_final || 0) >= 0;
                                      return (
                                        <tr
                                          key={rep.id}
                                          className="hover:bg-slate-800/30 transition-colors"
                                        >
                                          <td className="p-3 font-semibold text-white">
                                            {formatDatePt(rep.data)}
                                          </td>
                                          <td className="p-3 text-slate-300">
                                            <div className="font-medium text-slate-200">
                                              {rep.posto?.nome || 'Principal'}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                              {rep.user?.nome || 'Operador'}
                                            </div>
                                          </td>
                                          <td className="p-3 text-right font-mono text-sky-400 font-semibold">
                                            {formatKz(rep.total_vendas_brutas || 0)}
                                          </td>
                                          <td className="p-3 text-right font-mono text-sky-300">
                                            {formatKz(rep.total_taxas_acrescentadas || 0)}
                                          </td>
                                          <td className="p-3 text-right font-mono text-yellow-400">
                                            {rep.aki_bonus?.valor ? `+${formatKz(rep.aki_bonus.valor)}` : '—'}
                                          </td>
                                          <td className="p-3 text-right font-mono text-rose-400">
                                            {formatKz(rep.total_saidas || 0)}
                                          </td>
                                          <td className="p-3 text-right font-mono font-bold">
                                            <span
                                              className={
                                                dayPositive ? 'text-sky-400' : 'text-rose-400'
                                              }
                                            >
                                              {dayPositive ? '+' : ''}{formatKz(rep.total_final || 0)}
                                            </span>
                                          </td>
                                          <td className="p-3 text-center">
                                            {rep.status === 'fechado' ? (
                                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-950/80 border border-sky-600/40 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                                                Fechado
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 border border-amber-600/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                                Rascunho
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-3 text-center">
                                            <div className="inline-flex items-center gap-1.5 justify-center">
                                              <Link
                                                href={`/relatorio/${rep.id}`}
                                                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                                                title="Ver Fecho Digital"
                                              >
                                                <Eye size={13} />
                                              </Link>
                                              <button
                                                type="button"
                                                onClick={() => handleDownloadDayPdf(rep)}
                                                className="p-1.5 rounded-lg bg-sky-950/80 border border-sky-700/60 text-sky-300 hover:bg-sky-900 hover:text-white transition"
                                                title="Baixar PDF deste Dia"
                                              >
                                                <Download size={13} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <span className="text-xs text-slate-400">A carregar histórico mensal...</span>
          </div>
        </div>
      }
    >
      <RelatorioMensalContent />
    </Suspense>
  );
}


