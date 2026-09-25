'use client';

import React from 'react';
import { Lock, X } from 'lucide-react';
import { formatKz, formatDatePt } from '@/lib/utils';
import { CalculationResult } from '@/lib/calculations';

interface CloseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
  calculations: CalculationResult;
  activeReportDate: string;
}

export function CloseReportModal({
  isOpen,
  onClose,
  onConfirm,
  saving,
  calculations,
  activeReportDate,
}: CloseReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-w-md w-full rounded-2xl sm:rounded-3xl border border-emerald-800/80 bg-[#0c1322] p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Fechar Relatório Diário?</h3>
              <p className="text-xs text-slate-400">{formatDatePt(activeReportDate)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
            aria-label="Fechar modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Total Vendas:</span>
            <span className="font-mono font-bold text-white">{formatKz(calculations.total_vendas_brutas)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Lucro (+):</span>
            <span className="font-mono font-bold text-emerald-300">+{formatKz(calculations.total_taxas_acrescentadas)}</span>
          </div>
          {calculations.lucro_do_aki_bonus > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Bónus Aki (+):</span>
              <span className="font-mono font-bold text-yellow-400">+{formatKz(calculations.lucro_do_aki_bonus)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Total Saídas:</span>
            <span className="font-mono font-bold text-rose-400">-{formatKz(calculations.total_saidas)}</span>
          </div>
          <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
            <span className="text-white">Resultado Final:</span>
            <span className="font-mono text-emerald-400">{formatKz(calculations.total_final)}</span>
          </div>
        </div>

        <p className="text-[11px] text-amber-300 leading-relaxed bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl">
          Atenção: Ao fechar o relatório, os lançamentos tornam-se definitivos para fins de arquivo contábil e auditoria.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition disabled:opacity-60"
          >
            {saving ? 'A fechar...' : 'Confirmar & Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
}
