'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { formatKz, formatDatePt } from '@/lib/utils';
import { FinancialSummary } from '@/types';

interface FinancialChartsProps {
  summary: FinancialSummary;
  timeline: {
    date: string;
    vendas: number;
    lucroBruto: number;
    bonusAki?: number;
    saidas: number;
    resultadoLiquido: number;
  }[];
}

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ summary, timeline }) => {
  const formattedTimeline = timeline.map((item) => ({
    ...item,
    formattedDate: formatDatePt(item.date),
  }));

  const expensesData = Object.entries(summary.expenses.byCategory || {})
    .filter(([_, val]) => val > 0)
    .map(([cat, amount], idx) => ({
      name: cat.toUpperCase(),
      valor: amount,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 text-xs shadow-2xl backdrop-blur-md">
          <p className="font-semibold text-slate-200 mb-2 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-1">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-semibold text-white">
                {formatKz(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Evolução das Vendas e Lucros (Verde) vs Saídas (Vermelho) */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0f172a]/60 p-5 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Evolução Diária (Vendas, Lucros e Saídas)
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhamento de vendas brutas, lucros parciais e custos/despesas operacionais.
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          {formattedTimeline.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              Sem dados suficientes no período selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
                <Bar dataKey="vendas" name="Vendas Brutas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucroBruto" name="Lucro Operacional" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas / Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Distribuição das Saídas por Categoria (Vermelho & Tons) */}
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/60 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Saídas por Categoria
          </h3>
          <p className="text-xs text-slate-400">Distribuição percentual das despesas</p>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {expensesData.length === 0 ? (
            <div className="text-center text-xs text-slate-500">
              Nenhuma saída registada no período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesData}
                  dataKey="valor"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {expensesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatKz(Number(value)), 'Valor']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
