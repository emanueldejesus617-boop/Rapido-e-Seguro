'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Save,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Zap,
  Smartphone,
  CreditCard,
  Building2,
  TrendingUp,
  TrendingDown,
  Coins,
  X,
  Store,
} from 'lucide-react';
import { formatKz, formatDatePt } from '@/lib/utils';
import { calculateDailyReport, ChannelInput, ExpenseInput } from '@/lib/calculations';
import { DailyReport, ChannelName, ExpenseCategory, AuthUser, Posto } from '@/types';
import { CloseReportModal } from '@/components/CloseReportModal';

interface ReportFormProps {
  user: AuthUser | null;
  postos: Posto[];
  activeReportDate: string;
  onDateChange: (date: string) => void;
  activeReportPostoId?: string;
  onPostoChange?: (postoId: string) => void;
  activeReport: DailyReport | null;
  loading: boolean;
  onSaved: (report: DailyReport) => void;
}

const CHANNEL_CONFIG: Record<ChannelName, { label: string; icon: any }> = {
  aki: { label: 'Recarga AKI', icon: Zap },
  afrivendas: { label: 'Afrivendas', icon: Building2 },
  zap: { label: 'ZAP Directo', icon: Smartphone },
  unitel: { label: 'Unitel Directo', icon: Smartphone },
  cartoes: { label: 'Cartões Físicos', icon: CreditCard },
  chips: { label: 'Venda de CHIPs', icon: Smartphone },
};

const EMPTY_CHANNELS: Record<ChannelName, { valor_vendido: string; taxa: string }> = {
  aki: { valor_vendido: '', taxa: '' },
  afrivendas: { valor_vendido: '', taxa: '' },
  zap: { valor_vendido: '', taxa: '' },
  unitel: { valor_vendido: '', taxa: '' },
  cartoes: { valor_vendido: '', taxa: '' },
  chips: { valor_vendido: '', taxa: '' },
};

export function ReportForm({
  user,
  postos,
  activeReportDate,
  onDateChange,
  activeReportPostoId,
  onPostoChange,
  activeReport,
  loading,
  onSaved,
}: ReportFormProps) {
  const [channels, setChannels] = useState<typeof EMPTY_CHANNELS>({ ...EMPTY_CHANNELS });
  const [akiBonus, setAkiBonus] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [expenses, setExpenses] = useState<{ categoria: ExpenseCategory; descricao: string; valor: string }[]>([
    { categoria: 'taxi', descricao: '', valor: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const isClosed = activeReport?.status === 'fechado' && user?.role !== 'admin';
  const isReportFechado = activeReport?.status === 'fechado';

  // Preencher form com os dados do relatório existente
  useEffect(() => {
    if (activeReport) {
      const newCh: typeof EMPTY_CHANNELS = { ...EMPTY_CHANNELS };
      (activeReport.sales_entries || []).forEach((s) => {
        if (newCh[s.canal]) {
          newCh[s.canal] = {
            valor_vendido: s.valor_vendido > 0 ? String(s.valor_vendido) : '',
            taxa: s.taxa > 0 ? String(s.taxa) : '',
          };
        }
      });
      setChannels(newCh);
      setAkiBonus(activeReport.aki_bonus?.valor ? String(activeReport.aki_bonus.valor) : '');
      setObservacoes(activeReport.observacoes || '');
      if (activeReport.expenses && activeReport.expenses.length > 0) {
        setExpenses(
          activeReport.expenses.map((e) => ({
            categoria: e.categoria as ExpenseCategory,
            descricao: e.descricao,
            valor: String(e.valor),
          }))
        );
      } else {
        setExpenses([{ categoria: 'taxi', descricao: '', valor: '' }]);
      }
    } else {
      setChannels({ ...EMPTY_CHANNELS });
      setAkiBonus('');
      setObservacoes('');
      setExpenses([{ categoria: 'taxi', descricao: '', valor: '' }]);
    }
    setFeedback(null);
  }, [activeReport, activeReportDate]);

  // Cálculos em tempo real
  const calculations = useMemo(() => {
    const channelInputs: ChannelInput[] = (Object.keys(channels) as ChannelName[]).map((canal) => ({
      canal,
      valor_vendido: parseFloat(channels[canal].valor_vendido) || 0,
      taxa: parseFloat(channels[canal].taxa) || 0,
    }));
    const expenseInputs: ExpenseInput[] = expenses
      .filter((e) => (parseFloat(e.valor) || 0) > 0)
      .map((e) => ({
        categoria: e.categoria,
        descricao: e.descricao.trim() || (e.categoria === 'taxi' ? 'Táxi' : e.categoria === 'renda' ? 'Renda' : e.categoria === 'saldo' ? 'Saldo' : 'Outros'),
        valor: parseFloat(e.valor) || 0,
      }));
    return calculateDailyReport(channelInputs, parseFloat(akiBonus) || 0, expenseInputs);
  }, [channels, akiBonus, expenses]);

  const handleChannelChange = (canal: ChannelName, field: 'valor_vendido' | 'taxa', val: string) => {
    setChannels((prev) => ({ ...prev, [canal]: { ...prev[canal], [field]: val } }));
  };

  const handleExpenseChange = (index: number, field: string, val: string) => {
    setExpenses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const addExpenseRow = () => setExpenses((prev) => [...prev, { categoria: 'taxi', descricao: '', valor: '' }]);
  const removeExpenseRow = (index: number) => setExpenses((prev) => prev.filter((_, i) => i !== index));

  const handleSaveReport = async (statusToSet: 'rascunho' | 'fechado' = 'rascunho') => {
    try {
      setSaving(true);
      setFeedback(null);

      const targetPostoId = user?.role === 'admin'
        ? (activeReportPostoId || postos[0]?.id)
        : user?.postoId;

      const payload = {
        data: activeReportDate,
        postoId: targetPostoId,
        status: statusToSet,
        observacoes: observacoes.trim() || null,
        channels: (Object.keys(channels) as ChannelName[]).map((canal) => ({
          canal,
          valor_vendido: parseFloat(channels[canal].valor_vendido) || 0,
          taxa: parseFloat(channels[canal].taxa) || 0,
        })),
        akiBonus: parseFloat(akiBonus) || 0,
        expenses: expenses
          .filter((e) => (parseFloat(e.valor) || 0) > 0)
          .map((e) => {
            const defaultDesc =
              e.categoria === 'taxi'
                ? 'Táxi'
                : e.categoria === 'renda'
                ? 'Renda'
                : e.categoria === 'saldo'
                ? 'Saldo'
                : 'Despesa';
            return {
              categoria: e.categoria,
              descricao: e.descricao.trim() || defaultDesc,
              valor: parseFloat(e.valor) || 0,
            };
          }),
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar relatório');

      setFeedback({
        type: 'success',
        message: statusToSet === 'fechado' ? 'Relatório diário fechado com sucesso!' : 'Relatório diário salvo com sucesso!',
      });
      onSaved(data.report);
      setCloseConfirmOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro inesperado' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header com Navegação e Seletor de Data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/?view=dashboard"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition shrink-0"
            title="Voltar ao Painel Geral"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white">
                Preenchimento de Relatório Diário
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isReportFechado
                    ? user?.role === 'admin'
                      ? 'bg-blue-950/80 text-blue-400 border border-blue-600/50'
                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/50'
                    : 'bg-amber-950/80 text-amber-400 border border-amber-600/50'
                }`}
              >
                {isReportFechado ? <Lock size={11} /> : <RefreshCw size={11} />}
                {isReportFechado
                  ? user?.role === 'admin'
                    ? 'Fechado (Modo Admin: Edição Permitida)'
                    : 'Fechado'
                  : 'Em Aberto / Rascunho'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Insira as vendas e despesas do dia para apuramento automático do caixa.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Posto de Vendas */}
          {user?.role === 'admin' ? (
            <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-sm">
              <Store size={15} className="text-emerald-400 shrink-0" />
              <span className="text-slate-400">Posto:</span>
              <select
                value={activeReportPostoId || ''}
                onChange={(e) => onPostoChange && onPostoChange(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                {postos.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-300">
              <Store size={15} className="text-emerald-400 shrink-0" />
              <span>{user?.postoNome || 'Posto 1'}</span>
            </div>
          )}

          {/* Seletor de Data */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2 text-xs font-semibold text-emerald-300">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} className="text-emerald-400" />
              <span>Data:</span>
            </span>
            <input
              type="date"
              value={activeReportDate}
              onChange={(e) => { if (e.target.value) onDateChange(e.target.value); }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
            />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-2xl p-3.5 sm:p-4 text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
              : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white p-1">
            <X size={15} />
          </button>
        </div>
      )}

      {/* SEÇÃO 1: CANAIS DE VENDA */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white">1. Vendas por Canal & Taxas de Serviço</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                As taxas são valores acrescentados pelo serviço e somam ao valor arrecadado.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1 rounded-xl self-start sm:self-auto">
            Subtotal: {formatKz(calculations.soma_lucros_parciais)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(Object.keys(CHANNEL_CONFIG) as ChannelName[]).map((canal) => {
            const cfg = CHANNEL_CONFIG[canal];
            const Icon = cfg.icon;
            const valorNum = parseFloat(channels[canal].valor_vendido) || 0;
            const taxaNum = parseFloat(channels[canal].taxa) || 0;
            const arrecadado = valorNum + taxaNum;

            return (
              <div
                key={canal}
                className="rounded-2xl border border-slate-800/90 bg-[#090d18] p-3.5 sm:p-4 space-y-3 transition hover:border-emerald-500/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Icon size={15} />
                    </div>
                    <span className="text-xs font-bold text-white">{cfg.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-semibold text-slate-500 uppercase">Arrecadado</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">{formatKz(arrecadado)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">Valor Facial (Kz)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      disabled={isClosed}
                      placeholder="0 Kz"
                      value={channels[canal].valor_vendido}
                      onChange={(e) => handleChannelChange(canal, 'valor_vendido', e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-emerald-400 block mb-1">+ Lucro</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      disabled={isClosed}
                      placeholder="0 Kz"
                      value={channels[canal].taxa}
                      onChange={(e) => handleChannelChange(canal, 'taxa', e.target.value)}
                      className="w-full rounded-xl border border-emerald-900/60 bg-[#070b14] px-3 py-2.5 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 2: BÓNUS AKI */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Coins size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Bónus do AKI (Kz)
              <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                Informativo
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              Bónus atribuído pela plataforma AKI para acompanhamento.
            </p>
          </div>
        </div>
        <div className="w-full sm:w-48">
          <input
            type="number"
            inputMode="decimal"
            disabled={isClosed}
            placeholder="0 Kz"
            value={akiBonus}
            onChange={(e) => setAkiBonus(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#070b14] px-3.5 py-2.5 text-xs font-mono font-semibold text-emerald-300 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
          />
        </div>
      </div>

      {/* SEÇÃO 3: SAÍDAS / DESPESAS */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <TrendingDown size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-rose-400">2. Saídas e Despesas do Dia</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Custos operacionais que subtraem do caixa físico (Táxi, Renda, Saldo, Outros).
              </p>
            </div>
          </div>
          {!isClosed && (
            <button
              type="button"
              onClick={addExpenseRow}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 active:scale-95 transition self-start sm:self-auto"
            >
              <Plus size={14} />
              <span>+ Adicionar Saída</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {expenses.map((exp, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-2xl border border-slate-800/80 bg-[#090d18] p-3 transition hover:border-rose-900/60"
            >
              <div className="w-full sm:w-36">
                <select
                  disabled={isClosed}
                  value={exp.categoria}
                  onChange={(e) => handleExpenseChange(idx, 'categoria', e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2.5 text-xs font-medium text-slate-200 focus:border-rose-500 focus:outline-none disabled:opacity-60"
                >
                  <option value="taxi">Táxi</option>
                  <option value="renda">Renda</option>
                  <option value="saldo">Saldo</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              <div className="w-full sm:flex-1">
                <input
                  type="text"
                  disabled={isClosed}
                  placeholder="Descrição da despesa (ex: Táxi deslocação centro)"
                  value={exp.descricao}
                  onChange={(e) => handleExpenseChange(idx, 'descricao', e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#070b14] px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none disabled:opacity-60"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  inputMode="decimal"
                  disabled={isClosed}
                  placeholder="Valor (Kz)"
                  value={exp.valor}
                  onChange={(e) => handleExpenseChange(idx, 'valor', e.target.value)}
                  className="flex-1 sm:w-36 rounded-xl border border-rose-950 bg-[#070b14] px-3 py-2.5 text-xs font-mono font-semibold text-rose-400 focus:border-rose-500 focus:outline-none disabled:opacity-60"
                />
                {!isClosed && expenses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExpenseRow(idx)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-rose-950/60 hover:text-rose-400 active:scale-95 transition"
                    aria-label="Remover linha de saída"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-rose-950/20 border border-rose-900/30 px-4 py-2.5 text-xs text-rose-300">
          <span className="font-semibold">Subtotal Saídas do Dia:</span>
          <span className="font-mono font-bold text-sm text-rose-400">{formatKz(calculations.total_saidas)}</span>
        </div>
      </div>

      {/* SEÇÃO 4: OBSERVAÇÕES */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-5 shadow-xl space-y-2">
        <label className="text-xs font-bold text-slate-300 block">3. Observações do Caixa</label>
        <textarea
          rows={2}
          disabled={isClosed}
          placeholder="Anotações do operador, quebras de troco ou ocorrências do dia..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-[#070b14] p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* BARRA DE ACÇÃO & FECHO */}
      <div className="rounded-2xl sm:rounded-3xl border border-emerald-900/50 bg-gradient-to-r from-[#0a2118] via-[#0d1424] to-[#200d14] p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Resultado Líquido do Dia</div>

          {/* Valor com bónus */}
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              {formatKz(calculations.total_final)}
            </div>
            <span className="text-[10px] text-emerald-500 font-semibold">(c/ Bónus Aki)</span>
          </div>

          {/* Valor sem bónus */}
          {calculations.lucro_do_aki_bonus > 0 && (
            <div className="flex items-baseline gap-2">
              <div className="text-base sm:text-lg font-bold font-mono text-slate-300">
                {formatKz(calculations.total_final_sem_bonus)}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">(s/ Bónus Aki)</span>
            </div>
          )}

          {/* Barra de detalhe */}
          <div className="text-[10px] sm:text-[11px] text-slate-400 flex flex-wrap items-center gap-2 pt-1">
            <span>Vendas: <strong className="text-emerald-400">{formatKz(calculations.total_vendas_brutas)}</strong></span>
            <span>•</span>
            <span>Lucro Recarga AKI: <strong className="text-emerald-300">+{formatKz(calculations.recarga_aki_lucro)}</strong></span>
            <span>•</span>
            {calculations.lucro_do_aki_bonus > 0 && (
              <>
                <span>Bónus Aki: <strong className="text-yellow-400">+{formatKz(calculations.lucro_do_aki_bonus)}</strong></span>
                <span>•</span>
              </>
            )}
            <span>Saídas: <strong className="text-rose-400">-{formatKz(calculations.total_saidas)}</strong></span>
          </div>
        </div>


        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href="/?view=dashboard"
            className="flex-1 sm:flex-initial text-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
          >
            Voltar ao Painel
          </Link>

          {!isClosed && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveReport(isReportFechado ? 'fechado' : 'rascunho')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 sm:px-5 py-3 text-xs font-bold text-white hover:bg-slate-700 transition active:scale-95 disabled:opacity-60"
              >
                <Save size={15} className="text-emerald-400" />
                <span>{saving ? 'A gravar...' : isReportFechado ? 'Guardar Alterações' : 'Guardar Rascunho'}</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => setCloseConfirmOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/60 hover:from-emerald-500 hover:to-emerald-400 transition active:scale-95 disabled:opacity-60"
              >
                <Lock size={15} />
                <span>{isReportFechado ? 'Re-confirmar Fecho' : 'Fechar Relatório Diário'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Fecho */}
      <CloseReportModal
        isOpen={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        onConfirm={() => handleSaveReport('fechado')}
        saving={saving}
        calculations={calculations}
        activeReportDate={activeReportDate}
      />
    </div>
  );
}
