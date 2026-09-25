'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  History as HistoryIcon,
  Calendar,
  Lock,
  Clock,
  ArrowRight,
  Printer,
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Menu,
  Zap,
} from 'lucide-react';
import { formatKz, formatDatePt, getTodayDateString } from '@/lib/utils';
import { AuthUser, DailyReport } from '@/types';
import Link from 'next/link';
import { HeaderInstallButton } from '@/components/InstallPwaButton';

function HistoricoContent() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; report: DailyReport } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push('/login');
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      if (statusFilter !== 'ALL') query.append('status', statusFilter);

      const res = await fetch(`/api/reports?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
    loadReports();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      const res = await fetch(`/api/reports/${deleteModal.report.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showFeedback('success', 'Rascunho eliminado com sucesso!');
        setDeleteModal(null);
        loadReports();
      } else {
        const err = await res.json();
        showFeedback('error', err.error || 'Erro ao eliminar relatório.');
      }
    } catch {
      showFeedback('error', 'Erro de conexão.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pl-0 lg:pl-64">
      <Sidebar
        user={user}
        activeTab="historico"
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
              <div className="text-xs font-bold text-white leading-tight">Arquivo Digital</div>
              <div className="text-[9px] text-emerald-400 font-semibold uppercase">Rápido e Seguro</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HeaderInstallButton />
          <Link
            href="/?view=novo"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition hover:bg-emerald-500"
          >
            <Plus size={14} />
            <span>Novo Fecho</span>
          </Link>
        </div>
      </header>

      <main className="min-h-screen pb-16">
        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-30 border-b border-slate-800 bg-[#070b14]/95 px-8 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Arquivo Digital de Relatórios
              </h1>
              <p className="text-xs text-slate-400">
                Histórico permanente de vendas diárias substitui os cadernos em papel
              </p>
            </div>

            <div className="flex items-center gap-3">
              <HeaderInstallButton />
              <Link
                href="/?view=novo"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40 transition"
              >
                <Plus size={15} />
                <span>+ Novo Registo Diário</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          {feedback && (
            <div
              className={`flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'border border-emerald-800 bg-emerald-950/80 text-emerald-300'
                  : 'border border-rose-800 bg-rose-950/80 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Filter Bar */}
          <form
            onSubmit={handleFilter}
            className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 shadow-md"
          >
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
              <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                <Filter size={14} className="text-emerald-400" />
                Filtros:
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">De:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-[#070b14] p-2 text-white outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Até:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-[#070b14] p-2 text-white outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-[#070b14] p-2 text-white outline-none focus:border-emerald-500 text-xs"
              >
                <option value="ALL">Todos os Estados</option>
                <option value="fechado">Apenas Fechados</option>
                <option value="rascunho">Apenas Rascunhos</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
            >
              Aplicar Filtros
            </button>
          </form>

          {/* Reports Table / List */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-6 shadow-xl space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 px-3 font-semibold">Data do Relatório</th>
                    <th className="pb-3 px-3 font-semibold">Estado</th>
                    <th className="pb-3 px-3 font-semibold">Vendas Brutas</th>
                    <th className="pb-3 px-3 font-semibold text-emerald-400">Lucro (+Taxas)</th>
                    <th className="pb-3 px-3 font-semibold text-rose-400">Total Saídas</th>
                    <th className="pb-3 px-3 font-semibold text-emerald-300">TOTAL FINAL</th>
                    <th className="pb-3 px-3 font-semibold">Responsável</th>
                    <th className="pb-3 px-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-3 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-emerald-400" />
                          <span>{formatDatePt(r.data)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        {r.status === 'fechado' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-600/40">
                            <Lock size={10} /> Fechado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-600/40">
                            <Clock size={10} /> Rascunho
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-3 font-mono text-slate-200">
                        {formatKz(r.total_vendas_brutas)}
                      </td>
                      <td className="py-4 px-3 font-mono text-emerald-300 font-semibold">
                        {formatKz(r.soma_lucros_parciais)}
                      </td>
                      <td className="py-4 px-3 font-mono text-rose-300 font-semibold">
                        {formatKz(r.total_saidas)}
                      </td>
                      <td className="py-4 px-3 font-mono font-black text-emerald-400 text-sm">
                        {formatKz(r.total_final)}
                      </td>
                      <td className="py-4 px-3 text-slate-300">{r.user?.nome || 'Operador'}</td>
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/relatorio/${r.id}`}
                            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-slate-200 hover:bg-slate-700 hover:text-white transition"
                          >
                            <FileText size={13} className="text-emerald-400" />
                            <span>PDF</span>
                          </Link>

                          {r.status === 'rascunho' && (
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, report: r })}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                              title="Eliminar rascunho"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Nenhum relatório encontrado no arquivo para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        {deleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0d1424] p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertCircle size={24} />
                <h4 className="text-base font-bold text-white">Eliminar Rascunho</h4>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Tem a certeza que deseja eliminar o rascunho do dia <strong>{formatDatePt(deleteModal.report.data)}</strong>?
              </p>
              <div className="mt-6 flex justify-end gap-3 text-xs font-semibold">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-500 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HistoricoArquivoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-xs text-slate-400">A carregar arquivo digital...</span>
        </div>
      </div>
    }>
      <HistoricoContent />
    </Suspense>
  );
}
