'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  Printer,
  ArrowLeft,
  Calendar,
  Lock,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Building2,
  Receipt,
  Layers,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { formatKz, formatDatePt } from '@/lib/utils';
import { AuthUser, DailyReport } from '@/types';
import Link from 'next/link';

function ReportDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

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

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
    if (params.id) {
      loadReport();
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-xs text-slate-400">A carregar relatório oficial...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white p-4">
        <div className="text-center rounded-3xl border border-slate-800 bg-[#0d1424] p-8 max-w-sm w-full">
          <h2 className="text-base font-bold text-white">Relatório não encontrado</h2>
          <p className="text-xs text-slate-400 mt-1">O relatório solicitado não existe ou foi removido.</p>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pl-0 lg:pl-64 print:pl-0 print:bg-white print:text-slate-900">
      <div className="no-print">
        <Sidebar
          user={user}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <main className="min-h-screen pb-16 print:pb-0">
        {/* Navigation & Action Bar (No Print) */}
        <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-[#070b14]/95 px-4 sm:px-8 py-3 sm:py-4 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
            >
              <Menu size={18} />
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-base font-bold text-white truncate max-w-[160px] sm:max-w-none">
                Relatório — {formatDatePt(report.data)}
              </h1>
              {report.status === 'fechado' ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-600/40">
                  <Lock size={10} /> Fechado
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-600/40">
                  <Clock size={10} /> Rascunho
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 transition active:scale-95"
            >
              <Printer size={15} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* OFFICIAL DIGITAL REPORT SHEET (PRINT READY & RESPONSIVE) */}
        <div className="p-3 sm:p-6 md:p-8 print:p-0">
          <div className="mx-auto max-w-4xl rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-8 shadow-2xl print:border-none print:bg-white print:p-0 print:shadow-none space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-5 print:border-slate-300 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold print:border print:border-slate-800 shrink-0">
                  <Zap size={26} className="fill-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white print:text-black">
                    RÁPIDO E SEGURO
                  </h2>
                  <p className="text-xs font-medium text-emerald-400 print:text-slate-600">
                    Relatório Oficial de Fecho Diário de Recargas
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-400 print:text-slate-700">
                <div>
                  Data do Fecho: <strong className="text-white print:text-black text-sm">{formatDatePt(report.data)}</strong>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Responsável: {report.user?.nome || 'Operador'} ({report.user?.papel})
                </div>
              </div>
            </div>

            {/* HIGHLIGHT BOX: TOTAL FINAL DO DIA */}
            <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-950/70 to-[#062e1b] p-4 sm:p-6 shadow-xl print:border-emerald-700 print:bg-emerald-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 print:text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    TOTAL FINAL DO DIA (RESULTADO LÍQUIDO REAL)
                  </span>
                  <p className="text-xs text-emerald-400/90 print:text-emerald-800 mt-0.5">
                    Fórmula: Vendas + Lucros (+ Bónus AKI) − Saídas.
                  </p>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-300 print:text-emerald-900 font-mono">
                  {formatKz(report.total_final)}
                </div>
              </div>
            </div>

            {/* TABELA DE LUCRO PARCIAL POR CANAL */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-3">
                1. Demonstração de Vendas e Lucro Parcial por Canal
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs print:border print:border-slate-300 min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 print:border-slate-300 print:bg-slate-100 print:text-slate-800">
                      <th className="p-3 font-semibold">Canal de Venda</th>
                      <th className="p-3 font-semibold">Valor Vendido</th>
                      <th className="p-3 font-semibold text-emerald-400 print:text-emerald-700">+ Taxa Acrescentada</th>
                      <th className="p-3 font-semibold text-emerald-400 print:text-emerald-700 text-right">
                        Lucro Parcial (Venda + Taxa)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                    {(report.sales_entries || []).map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="p-3 font-semibold uppercase text-white print:text-black">
                          {s.canal}
                        </td>
                        <td className="p-3 font-mono text-slate-300 print:text-black">
                          {formatKz(s.valor_vendido)}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 print:text-emerald-700">
                          {s.taxa > 0 ? `+${formatKz(s.taxa)}` : '0 Kz'}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400 print:text-emerald-800 text-right">
                          {formatKz(s.lucro_parcial)}
                        </td>
                      </tr>
                    ))}

                    <tr className="border-t-2 border-slate-700 bg-slate-900/50 font-bold print:border-slate-400 print:bg-slate-100">
                      <td className="p-3 text-white print:text-black">SUBTOTAL LUCROS PARCIAIS</td>
                      <td className="p-3 font-mono text-white print:text-black">
                        {formatKz(report.total_vendas_brutas)}
                      </td>
                      <td className="p-3 font-mono text-emerald-400 print:text-emerald-700">—</td>
                      <td className="p-3 font-mono text-emerald-400 print:text-emerald-800 text-right">
                        {formatKz(report.soma_lucros_parciais)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* LUCRO DO AKI (BÓNUS) DESTACADO SEPARADAMENTE */}
            <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-950/20 p-4 print:border-emerald-300 print:bg-emerald-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-300 print:text-emerald-900 uppercase">
                    Bónus do AKI (Informativo)
                  </span>
                  <p className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                    Valor atribuído pela plataforma AKI para registo e controlo.
                  </p>
                </div>
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-300 print:text-emerald-900 font-mono">
                {formatKz(report.aki_bonus?.valor || 0)}
              </div>
            </div>

            {/* LISTA DE SAÍDAS / DESPESAS */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-3">
                2. Discriminação de Saídas e Despesas de Caixa
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs print:border print:border-slate-300 min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 print:border-slate-300 print:bg-slate-100 print:text-slate-800">
                      <th className="p-3 font-semibold">Categoria</th>
                      <th className="p-3 font-semibold">Descrição da Despesa</th>
                      <th className="p-3 font-semibold text-right text-rose-400 print:text-rose-700">Valor (Kz)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                    {(report.expenses || []).map((e, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold uppercase text-slate-300 print:text-black">
                          {e.categoria}
                        </td>
                        <td className="p-3 text-slate-300 print:text-black">
                          {e.descricao}
                        </td>
                        <td className="p-3 font-mono font-bold text-rose-400 print:text-rose-700 text-right">
                          {formatKz(e.valor)}
                        </td>
                      </tr>
                    ))}
                    {(report.expenses || []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-500">
                          Nenhuma saída registada nesta data.
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-slate-700 bg-slate-900/50 font-bold print:border-slate-400 print:bg-slate-100">
                      <td colSpan={2} className="p-3 text-white print:text-black">TOTAL DE SAÍDAS</td>
                      <td className="p-3 font-mono text-rose-400 print:text-rose-700 text-right">
                        {formatKz(report.total_saidas)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* OBSERVAÇÕES */}
            {report.observacoes && (
              <div className="rounded-2xl border border-slate-800 bg-[#090e1b] p-4 text-xs">
                <span className="font-bold text-slate-400 block mb-1">Observações do Fecho:</span>
                <p className="text-slate-300 print:text-black">{report.observacoes}</p>
              </div>
            )}

            {/* SIGNATURE AREA (PRINT) */}
            <div className="mt-10 pt-6 border-t border-slate-800 print:border-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs text-slate-500">
              <div className="space-y-1">
                <p>Relatório gerado digitalmente pela plataforma <strong className="text-slate-300 print:text-black">Rápido e Seguro</strong></p>
                <p className="text-[10px]">Substituição oficial de relatórios em papel</p>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[9px] uppercase tracking-widest text-slate-600">Desenvolvido por</span>
                  <span className="text-[10px] font-extrabold tracking-widest text-slate-500 print:text-slate-700 uppercase">EMANUS</span>
                  <span className="text-[9px] text-slate-600">· Emanuel De Jesus</span>
                </div>
              </div>
              <div className="text-center w-full sm:w-52 border-t border-slate-600 print:border-slate-800 pt-2">
                <p className="font-bold text-slate-300 print:text-black">Assinatura do Vendedor</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-xs text-slate-400">A carregar relatório...</span>
        </div>
      </div>
    }>
      <ReportDetailContent />
    </Suspense>
  );
}
