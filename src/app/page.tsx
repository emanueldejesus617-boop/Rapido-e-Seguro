'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ReportForm } from '@/components/ReportForm';
import { DashboardPanel } from '@/components/DashboardPanel';
import { Menu, Zap, Plus, ArrowLeft, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { getTodayDateString, formatDatePt, formatKz } from '@/lib/utils';
import { AuthUser, DailyReport, FinancialSummary, Posto } from '@/types';
import { HeaderInstallButton } from '@/components/InstallPwaButton';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [postos, setPostos] = useState<Posto[]>([]);
  const [selectedPostoId, setSelectedPostoId] = useState<string>('all');
  const [activeReportPostoId, setActiveReportPostoId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // View mode: 'dashboard' | 'novo'
  const currentView = searchParams.get('view') === 'novo' ? 'novo' : 'dashboard';

  // Period: 'today' | 'last_7_days' | 'weekly' | 'monthly' | 'all'
  const currentPeriod = (searchParams.get('period') || 'last_7_days') as string;

  // Data do relatório ativo para preenchimento/edição
  const [activeReportDate, setActiveReportDate] = useState<string>(getTodayDateString());
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);

  // Dados consolidados do período selecionado
  const [summaryData, setSummaryData] = useState<FinancialSummary | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [periodReports, setPeriodReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ report: DailyReport } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dashFeedback, setDashFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Auth Check & Postos
  const fetchAuthAndPostos = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) { router.push('/login'); return; }
      const data = await res.json();
      setUser(data.user);

      // Se for vendedor, fixa seu postoId
      if (data.user.postoId) {
        setSelectedPostoId(data.user.postoId);
        setActiveReportPostoId(data.user.postoId);
      }

      // Buscar postos de venda
      const resPostos = await fetch('/api/postos');
      if (resPostos.ok) {
        const pData = await resPostos.json();
        setPostos(pData.postos || []);
        if (data.user.role === 'admin' && pData.postos?.length > 0) {
          setActiveReportPostoId((prev) => prev || pData.postos[0].id);
        }
      }
    } catch {
      router.push('/login');
    }
  };

  // 2. Carregar sumário e lista de relatórios do período
  const loadPeriodData = async (period: string, postoId: string) => {
    try {
      const postoParam = postoId && postoId !== 'all' ? `&postoId=${postoId}` : '';
      const res = await fetch(`/api/summary?period=${period}${postoParam}`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data.summary);
        setTimelineData(data.timeline || []);
        setPeriodReports(data.reports || []);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do período:', e);
    }
  };

  // 3. Carregar relatório diário ativo para a data e posto selecionados
  const loadActiveReport = async (dateStr: string, postoId?: string) => {
    try {
      setLoading(true);
      const targetPosto = postoId || (user?.role === 'admin' ? activeReportPostoId : user?.postoId);
      const postoParam = targetPosto ? `&postoId=${targetPosto}` : '';
      const res = await fetch(`/api/reports?data=${dateStr}${postoParam}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReport(data.report ?? null);
        if (data.report?.postoId) {
          setActiveReportPostoId(data.report.postoId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlData = searchParams.get('data');
    const urlPostoId = searchParams.get('postoId');
    if (urlData) {
      setActiveReportDate(urlData);
    }
    if (urlPostoId) {
      setActiveReportPostoId(urlPostoId);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAuthAndPostos();
  }, []);

  useEffect(() => {
    if (user) {
      loadPeriodData(currentPeriod, selectedPostoId);
      loadActiveReport(activeReportDate, activeReportPostoId);
    }
  }, [user, currentPeriod, selectedPostoId, activeReportDate, activeReportPostoId]);

  const handleChangePeriod = (p: string) => {
    router.push(`/?view=dashboard&period=${p}`);
  };

  const handleOpenReport = (date: string, postoId?: string) => {
    setActiveReportDate(date);
    if (postoId) {
      setActiveReportPostoId(postoId);
    }
    router.push('/?view=novo');
  };

  const handleReportSaved = (report: DailyReport) => {
    setActiveReport(report);
    if (report.postoId) {
      setActiveReportPostoId(report.postoId);
    }
    loadPeriodData(currentPeriod, selectedPostoId);
  };

  const handleDeleteFromDashboard = async () => {
    if (!deleteModal) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/reports/${deleteModal.report.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteModal(null);
        setDashFeedback({ type: 'success', message: 'Relatório eliminado com sucesso!' });
        setTimeout(() => setDashFeedback(null), 5000);
        loadPeriodData(currentPeriod, selectedPostoId);
      } else {
        const err = await res.json();
        setDashFeedback({ type: 'error', message: err.error || 'Erro ao eliminar relatório.' });
        setTimeout(() => setDashFeedback(null), 5000);
      }
    } catch {
      setDashFeedback({ type: 'error', message: 'Erro de conexão.' });
      setTimeout(() => setDashFeedback(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pl-0 lg:pl-64 font-sans selection:bg-emerald-500 selection:text-white transition-all">
      <Sidebar
        user={user}
        activeTab={currentView === 'novo' ? 'novo' : currentPeriod}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Top Header */}
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
              <Zap size={16} className="fill-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Rápido e Seguro</div>
              <div className="text-[9px] text-emerald-400 font-semibold uppercase">
                {user?.postoNome || 'Gestão de Vendas'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HeaderInstallButton />
          <Link
            href={currentView === 'novo' ? '/?view=dashboard' : '/?view=novo'}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition ${
              currentView === 'novo'
                ? 'bg-slate-800 border border-slate-700 text-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {currentView === 'novo' ? <ArrowLeft size={14} /> : <Plus size={14} />}
            <span>{currentView === 'novo' ? 'Painel' : 'Relatório'}</span>
          </Link>
        </div>
      </header>

      <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {currentView === 'novo' ? (
          <ReportForm
            user={user}
            postos={postos}
            activeReportDate={activeReportDate}
            onDateChange={setActiveReportDate}
            activeReportPostoId={activeReportPostoId}
            onPostoChange={setActiveReportPostoId}
            activeReport={activeReport}
            loading={loading}
            onSaved={handleReportSaved}
          />
        ) : (
          <>
            {dashFeedback && (
              <div className={`flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-semibold ${
                dashFeedback.type === 'success'
                  ? 'border border-emerald-800 bg-emerald-950/80 text-emerald-300'
                  : 'border border-rose-800 bg-rose-950/80 text-rose-300'
              }`}>
                {dashFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{dashFeedback.message}</span>
              </div>
            )}
            <DashboardPanel
              user={user}
              postos={postos}
              selectedPostoId={selectedPostoId}
              onChangePosto={setSelectedPostoId}
              summaryData={summaryData}
              timelineData={timelineData}
              periodReports={periodReports}
              currentPeriod={currentPeriod}
              onChangePeriod={handleChangePeriod}
              onOpenReport={handleOpenReport}
              onDeleteReport={user?.role === 'admin' ? (rep) => setDeleteModal({ report: rep }) : undefined}
            />
          </>
        )}
      </main>

      {/* Delete Confirmation Modal (Dashboard) */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-900/60 bg-[#0d1424] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {deleteModal.report.status === 'fechado' ? 'Eliminar Relatório Fechado' : 'Eliminar Rascunho'}
                </h4>
                <p className="text-xs text-slate-400">{formatDatePt(deleteModal.report.data)} — {deleteModal.report.posto?.nome || 'Posto'}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#070b14] p-3 text-xs flex justify-between">
              <span className="text-slate-400">Total Vendas:</span>
              <span className="font-mono text-emerald-400 font-bold">{formatKz(deleteModal.report.total_vendas_brutas)}</span>
            </div>
            <p className="text-xs text-rose-300/90 leading-relaxed bg-rose-950/40 border border-rose-800/40 p-3 rounded-xl">
              {deleteModal.report.status === 'fechado'
                ? 'Este relatório fechado será apagado permanentemente da base de dados.'
                : 'Este rascunho será apagado permanentemente. Esta ação não pode ser desfeita.'}
            </p>
            <div className="flex justify-end gap-3 text-xs font-semibold">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModal(null)}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteFromDashboard}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-white hover:bg-rose-500 transition disabled:opacity-60 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>{deleting ? 'A eliminar...' : 'Confirmar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SaaSMainDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-xs text-slate-400">A carregar plataforma Rápido e Seguro...</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
