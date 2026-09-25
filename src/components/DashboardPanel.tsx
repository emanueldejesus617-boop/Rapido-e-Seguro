'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Lock,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  Printer,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Store,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { formatKz, formatDatePt } from '@/lib/utils';
import { FinancialCharts } from '@/components/FinancialCharts';
import { FinancialSummary, DailyReport, AuthUser, Posto } from '@/types';

interface DashboardPanelProps {
  user: AuthUser | null;
  postos: Posto[];
  selectedPostoId: string;
  onChangePosto: (postoId: string) => void;
  summaryData: FinancialSummary | null;
  timelineData: any[];
  periodReports: DailyReport[];
  currentPeriod: string;
  onChangePeriod: (period: string) => void;
  onOpenReport: (date: string, postoId?: string) => void;
}

const PERIOD_TABS = [
  { key: 'today', label: 'Hoje', icon: null },
  { key: 'last_7_days', label: '7 Dias', icon: null },
  { key: 'weekly', label: 'Semanal', icon: CalendarRange },
  { key: 'monthly', label: 'Mensal', icon: CalendarCheck },
  { key: 'all', label: 'Todos', icon: null },
];

export function DashboardPanel({
  user,
  postos,
  selectedPostoId,
  onChangePosto,
  summaryData,
  timelineData,
  periodReports,
  currentPeriod,
  onChangePeriod,
  onOpenReport,
}: DashboardPanelProps) {
  const netResult = summaryData?.netResult || 0;
  const isGerente = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header do Painel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {isGerente ? 'Painel Executivo da Gerência' : `Painel do Operador • ${user?.postoNome || 'Posto'}`}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Controlo de Caixa & Relatórios</span>
            {!isGerente && user?.postoNome && (
              <span className="text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Store size={14} />
                {user.postoNome}
              </span>
            )}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            {isGerente
              ? 'Visão consolidada com distinção clara entre os postos de venda da Rápido e Seguro.'
              : `Relatórios diários e fechos de caixa restritos ao ${user?.postoNome || 'seu posto'}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/?view=novo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950/60 hover:from-emerald-500 hover:to-emerald-400 transition-all active:scale-95"
          >
            <PlusCircle size={17} />
            <span>Começar Relatório</span>
          </Link>
          <Link
            href="/historico"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#0d1424] px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" />
            <span>Arquivo Digital</span>
          </Link>
        </div>
      </div>

      {/* SELETOR DE POSTO PARA GERENTE / BADGE FIXO PARA VENDEDOR */}
      {isGerente ? (
        <div className="rounded-2xl border border-emerald-900/50 bg-[#091322] p-3 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Store size={16} className="text-emerald-400" />
            <span>Filtrar por Posto de Vendas (Gerente Cristovão):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onChangePosto('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                selectedPostoId === 'all'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>Todos os Postos (Consolidado)</span>
            </button>

            {postos.map((p) => (
              <button
                key={p.id}
                onClick={() => onChangePosto(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedPostoId === p.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Store size={13} />
                <span>{p.nome}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-950 bg-emerald-950/20 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-emerald-400" />
            <span>Dados isolados e restritos ao <strong>{user?.postoNome || 'seu Posto'}</strong></span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-medium">Sessão Operador</span>
        </div>
      )}

      {/* Filtros de Período */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1424] p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="hidden sm:flex text-xs font-semibold text-slate-400 px-2 py-1 items-center gap-1.5">
            <CalendarDays size={14} className="text-emerald-400" />
            Filtro:
          </span>
          {PERIOD_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onChangePeriod(key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1 ${
                currentPeriod === key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {Icon && <Icon size={13} />}
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-400 px-2 font-medium flex items-center justify-between sm:justify-end gap-1.5 border-t sm:border-t-0 border-slate-800 pt-1 sm:pt-0">
          <span className="text-slate-500">Período:</span>
          <span className="text-emerald-400 font-bold">{summaryData?.period.label || '...'}</span>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Vendas */}
        <div className="rounded-2xl sm:rounded-3xl border border-emerald-900/40 bg-gradient-to-br from-[#0c1f17] to-[#080d19] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400/90 uppercase tracking-wider">Total Vendas</span>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono">
            {formatKz(summaryData?.sales.totalSales || 0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
            Volume faturado ({summaryData?.reportCount || 0} relatórios)
          </p>
        </div>

        {/* Lucro */}
        <div className="rounded-2xl sm:rounded-3xl border border-emerald-800/40 bg-gradient-to-br from-[#0d271d] to-[#080d19] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400/90 uppercase tracking-wider">Lucro (+ Taxas)</span>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-300 font-mono">
            {formatKz(summaryData?.sales.totalTaxas || 0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Soma dos lucros inseridos por canal</p>
        </div>

        {/* Bónus Aki */}
        <div className="rounded-2xl sm:rounded-3xl border border-yellow-800/40 bg-gradient-to-br from-[#1f1a06] to-[#080d19] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-yellow-400/90 uppercase tracking-wider">Bónus Aki</span>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-3 text-xl sm:text-2xl md:text-3xl font-extrabold text-yellow-400 font-mono">
            {formatKz(summaryData?.sales.totalAkiBonus || 0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Bónus acumulado do canal Aki</p>
        </div>

        {/* Total Saídas */}
        <div className="rounded-2xl sm:rounded-3xl border border-rose-900/50 bg-gradient-to-br from-[#270d13] to-[#080d19] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400/90 uppercase tracking-wider">Total Saídas</span>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-3 text-xl sm:text-2xl md:text-3xl font-extrabold text-rose-400 font-mono">
            {formatKz(summaryData?.expenses.totalExpenses || 0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Táxis, rendas, saldos e despesas</p>
        </div>

        {/* Resultado Líquido Final */}
        <div
          className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xl ${
            netResult >= 0
              ? 'border-emerald-500/50 bg-gradient-to-br from-[#0e3120] to-[#080d19]'
              : 'border-rose-500/50 bg-gradient-to-br from-[#330f16] to-[#080d19]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${netResult >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              Total Líquido
            </span>
            <div
              className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border ${
                netResult >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
              }`}
            >
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className={`mt-3 text-xl sm:text-2xl md:text-3xl font-extrabold font-mono ${netResult >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {formatKz(netResult)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-300 mt-1 font-medium">Saldo líquido apurado no caixa</p>
        </div>
      </div>

      {/* Gráficos Financeiros */}
      {summaryData && <FinancialCharts summary={summaryData} timeline={timelineData} />}

      {/* Tabela de Relatórios do Período */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-emerald-400" />
              Relatórios Apurados no Período ({summaryData?.period.label})
            </h3>
            <p className="text-[11px] text-slate-400">
              Histórico de fechos diários com distinção visual por posto de vendas.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="border-b border-slate-800 bg-[#090e1b] text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-3 sm:px-4">Data do Fecho</th>
                <th className="py-3.5 px-3 sm:px-4">Posto de Venda</th>
                <th className="py-3.5 px-3 sm:px-4">Operador</th>
                <th className="py-3.5 px-3 sm:px-4">Estado</th>
                <th className="py-3.5 px-3 sm:px-4 text-right">Vendas</th>
                <th className="py-3.5 px-3 sm:px-4 text-right text-emerald-400">Lucro</th>
                <th className="py-3.5 px-3 sm:px-4 text-right text-yellow-400">Bónus Aki</th>
                <th className="py-3.5 px-3 sm:px-4 text-right text-rose-400">Saídas</th>
                <th className="py-3.5 px-3 sm:px-4 text-right text-emerald-300">Total Líquido</th>
                <th className="py-3.5 px-3 sm:px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {periodReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Nenhum relatório registado para este período ou posto selecionado.
                  </td>
                </tr>
              ) : (
                periodReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-emerald-400" />
                        <span>{formatDatePt(rep.data)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                        <Store size={12} className="text-emerald-400" />
                        {rep.posto?.nome || 'Posto'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-300">
                      {rep.user?.nome || 'Operador'}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          rep.status === 'fechado'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                        }`}
                      >
                        {rep.status === 'fechado' ? <Lock size={10} /> : <RefreshCw size={10} />}
                        {rep.status === 'fechado' ? 'Fechado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-emerald-400">
                      {formatKz(rep.total_vendas_brutas || 0)}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-emerald-300 font-bold">
                      {formatKz(rep.soma_lucros_parciais || 0)}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-yellow-400 font-bold">
                      {rep.aki_bonus?.valor ? `+${formatKz(rep.aki_bonus.valor)}` : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-rose-400">
                      {formatKz(rep.total_saidas || 0)}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-emerald-300 text-sm">
                      {formatKz(rep.total_final || 0)}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onOpenReport(rep.data, rep.postoId)}
                          title="Abrir para Edição"
                          className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-emerald-600 hover:text-white transition"
                        >
                          <Eye size={14} />
                        </button>
                        <Link
                          href={`/relatorio/${rep.id}`}
                          title="Imprimir PDF Oficial"
                          className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-emerald-400 hover:bg-slate-700 transition"
                        >
                          <Printer size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
