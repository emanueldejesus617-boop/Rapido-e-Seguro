'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Plus,
  Trash2,
  Printer,
  Gift,
  Building2,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { WholesaleCustomer, WholesaleSale } from '@/types';
import { formatKz, formatDatePt } from '@/lib/utils';
import {
  getProductConfig,
  groupSalesByMonth,
  MonthSubtotals,
} from './wholesaleConfig';

interface CustomerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: WholesaleCustomer | null;
  onOpenNewSale: () => void;
  onSaleDeleted: (saleId: string) => void;
  onCustomerDeleted: (customerId: string) => void;
  userRole?: string;
}

export function CustomerDetailDrawer({
  isOpen,
  onClose,
  customer,
  onOpenNewSale,
  onSaleDeleted,
  onCustomerDeleted,
  userRole,
}: CustomerDetailDrawerProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showProductBreakdown, setShowProductBreakdown] = useState<boolean>(true);

  const sales = customer?.sales || [];

  // Agrupamento por mês com todos os subtotais
  const monthsData = useMemo(() => groupSalesByMonth(sales), [sales]);

  // Meses a serem exibidos de acordo com o filtro selecionado
  const displayedMonths = useMemo(() => {
    if (selectedMonth === 'all') return monthsData;
    return monthsData.filter((m) => m.yearMonth === selectedMonth);
  }, [monthsData, selectedMonth]);

  // Subtotais consolidados do que está visível na tela
  const currentViewSubtotals = useMemo(() => {
    return displayedMonths.reduce(
      (acc, m) => {
        acc.quantidade += m.totalQuantidade;
        acc.valorBruto += m.totalValor;
        acc.bonus += m.totalBonus;
        acc.total += m.totalFinal;
        acc.salesCount += m.salesCount;
        return acc;
      },
      { quantidade: 0, valorBruto: 0, bonus: 0, total: 0, salesCount: 0 }
    );
  }, [displayedMonths]);

  if (!isOpen || !customer) return null;

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    try {
      setDeletingCustomer(true);
      const res = await fetch(`/api/wholesale/customers/${customer.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao eliminar cliente');
      }
      onCustomerDeleted(customer.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar cliente');
    } finally {
      setDeletingCustomer(false);
      setConfirmDeleteCustomer(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm('Tem certeza de que deseja eliminar este registo de venda a grosso?')) {
      return;
    }

    try {
      setDeletingId(saleId);
      const res = await fetch(`/api/wholesale/sales/${saleId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao eliminar venda');
      }
      onSaleDeleted(saleId);
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar venda');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[94vh] rounded-3xl border border-slate-800 bg-[#0c1322] shadow-2xl flex flex-col overflow-hidden">
        {/* Cabeçalho do Cliente */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-[#090d18] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-950/60 font-black text-xl shrink-0">
              {customer.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  {customer.nome}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                {customer.telefone && (
                  <a
                    href={`tel:${customer.telefone}`}
                    className="flex items-center gap-1 hover:text-sky-400 transition"
                  >
                    <Phone size={12} className="text-sky-400" />
                    <span className="font-mono">{customer.telefone}</span>
                  </a>
                )}
                {customer.localizacao && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-500" />
                    <span>{customer.localizacao}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Imprimir Extrato do Cliente"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Extrato</span>
            </button>
            <button
              onClick={onOpenNewSale}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-950/60 hover:from-sky-400 hover:to-blue-500 transition active:scale-95"
            >
              <Plus size={15} />
              <span>Nova Venda a Grosso</span>
            </button>
            <button
              onClick={() => setConfirmDeleteCustomer(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-800/60 bg-rose-950/40 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-900/60 hover:text-rose-300 transition active:scale-95"
              title="Eliminar Cliente"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Eliminar Cliente</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0 ml-1"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Resumo Global Acumulado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-5 border-b border-slate-800/60 bg-[#080c16]">
          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Acumulado</div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-sky-400 mt-0.5">
              {formatKz(customer.totalSpent || 0)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Bónus</div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-yellow-400 mt-0.5">
              +{formatKz(customer.totalBonus || 0)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nº de Vendas</div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-white mt-0.5">
              {customer.salesCount || 0}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meses c/ Histórico</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
              {monthsData.length} {monthsData.length === 1 ? 'mês' : 'meses'}
            </div>
          </div>
        </div>

        {/* Barra de Filtro por Mês */}
        {monthsData.length > 0 && (
          <div className="px-5 py-3.5 border-b border-slate-800/80 bg-[#0a0f1d] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 shrink-0 mr-1">
                <Calendar size={14} className="text-sky-400" />
                <span>Filtrar Mês:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shrink-0 ${
                  selectedMonth === 'all'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950/60'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Todos os Meses ({sales.length})
              </button>
              {monthsData.map((m) => (
                <button
                  key={m.yearMonth}
                  type="button"
                  onClick={() => setSelectedMonth(m.yearMonth)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shrink-0 ${
                    selectedMonth === m.yearMonth
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-950/60'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label} ({m.salesCount})
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowProductBreakdown(!showProductBreakdown)}
              className="text-xs font-semibold text-slate-400 hover:text-sky-300 flex items-center gap-1 shrink-0 ml-auto"
            >
              <Package size={13} className="text-sky-400" />
              <span>{showProductBreakdown ? 'Ocultar subtotais por produto' : 'Ver subtotais por produto'}</span>
              {showProductBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        )}

        {/* Conteúdo com Histórico Mensal e Subtotais */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {sales.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-[#080c16] p-6 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500">
                <ShoppingBag size={22} />
              </div>
              <h4 className="text-sm font-bold text-white">Nenhuma venda registada para este cliente</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Clique no botão abaixo para lançar a primeira venda a grosso para {customer.nome}.
              </p>
              <button
                type="button"
                onClick={onOpenNewSale}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-950/60"
              >
                <Plus size={14} />
                <span>Lançar Venda Agora</span>
              </button>
            </div>
          ) : (
            displayedMonths.map((month) => {
              const productItems = Object.values(month.byProduct);

              return (
                <div
                  key={month.yearMonth}
                  className="rounded-3xl border border-slate-800/90 bg-[#090d18] p-4 sm:p-5 shadow-xl space-y-4"
                >
                  {/* Cabeçalho do Mês */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                          <span>{month.label}</span>
                          <span className="text-xs font-normal text-slate-400">
                            ({month.salesCount} {month.salesCount === 1 ? 'venda' : 'vendas'})
                          </span>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">Subtotal do Mês:</span>
                      <span className="font-mono font-black text-sky-400 text-sm sm:text-base">
                        {formatKz(month.totalFinal)}
                      </span>
                    </div>
                  </div>

                  {/* Subtotais de cada métrica no Mês */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="rounded-2xl border border-slate-800/90 bg-[#070b14] p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Subtotal Quantidade
                      </span>
                      <span className="font-mono font-extrabold text-sm sm:text-base text-white mt-0.5 block">
                        {month.totalQuantidade} <span className="text-xs font-normal text-slate-400">un</span>
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-800/90 bg-[#070b14] p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Subtotal Valor Base
                      </span>
                      <span className="font-mono font-extrabold text-sm sm:text-base text-slate-300 mt-0.5 block">
                        {formatKz(month.totalValor)}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-800/90 bg-[#070b14] p-3">
                      <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider block">
                        Subtotal Bónus (+)
                      </span>
                      <span className="font-mono font-extrabold text-sm sm:text-base text-yellow-400 mt-0.5 block">
                        +{formatKz(month.totalBonus)}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-sky-900/60 bg-sky-950/20 p-3">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        Subtotal Faturado
                      </span>
                      <span className="font-mono font-extrabold text-sm sm:text-base text-sky-400 mt-0.5 block">
                        {formatKz(month.totalFinal)}
                      </span>
                    </div>
                  </div>

                  {/* Subtotais por Produto no Mês */}
                  {showProductBreakdown && productItems.length > 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-3.5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        <Package size={13} className="text-sky-400" />
                        <span>Subtotais Discriminados por Produto ({month.label})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {productItems.map((prod) => (
                          <div
                            key={prod.produto}
                            className="rounded-xl border border-slate-800/80 bg-[#0a0f1e] p-2.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${prod.badgeClass}`}>
                                {prod.label}
                              </span>
                              <div className="text-[11px] text-slate-400 mt-1">
                                Qtd: <strong className="text-white font-mono">{prod.quantidade}</strong> un
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-extrabold text-sky-400">
                                {formatKz(prod.totalFinal)}
                              </div>
                              {prod.bonusTotal > 0 && (
                                <div className="text-[10px] font-mono text-yellow-400">
                                  Bónus: +{formatKz(prod.bonusTotal)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tabela de Vendas do Mês */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#070b14]">
                    <table className="w-full text-left text-xs min-w-[620px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50 font-semibold">
                          <th className="p-3">Data</th>
                          <th className="p-3">Produto</th>
                          <th className="p-3 text-right">Qtd</th>
                          <th className="p-3 text-right">Valor Unitário</th>
                          <th className="p-3 text-right text-yellow-400">+ Bónus</th>
                          <th className="p-3 text-right text-sky-400 font-bold">Total</th>
                          <th className="p-3">Observações</th>
                          {userRole === 'admin' && <th className="p-3 text-center">Ações</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {month.sales.map((s) => {
                          const cfg = getProductConfig(s.produto);
                          return (
                            <tr key={s.id} className="hover:bg-slate-800/20 transition">
                              <td className="p-3 font-mono text-slate-300">
                                {formatDatePt(s.data)}
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${cfg.badgeClass}`}>
                                  {cfg.label}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-right text-white font-semibold">
                                {s.quantidade}
                              </td>
                              <td className="p-3 font-mono text-right text-slate-300">
                                {formatKz(s.valor)}
                              </td>
                              <td className="p-3 font-mono text-right text-yellow-400 font-semibold">
                                {s.bonus > 0 ? `+${formatKz(s.bonus)}` : '—'}
                              </td>
                              <td className="p-3 font-mono text-right text-sky-400 font-extrabold">
                                {formatKz(s.total)}
                              </td>
                              <td className="p-3 text-slate-400 max-w-[150px] truncate" title={s.observacoes || ''}>
                                {s.observacoes || '—'}
                              </td>
                              {userRole === 'admin' && (
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    disabled={deletingId === s.id}
                                    onClick={() => handleDeleteSale(s.id)}
                                    className="text-slate-500 hover:text-rose-400 transition p-1 rounded-lg hover:bg-rose-950/40 disabled:opacity-40"
                                    title="Remover venda"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Linha Final de Subtotal do Mês na Tabela */}
                      <tfoot>
                        <tr className="border-t-2 border-slate-700 bg-slate-900/80 font-bold text-xs">
                          <td className="p-3 text-white uppercase tracking-wider">
                            Subtotal {month.label}
                          </td>
                          <td className="p-3 text-slate-400">
                            {month.salesCount} operações
                          </td>
                          <td className="p-3 font-mono text-right text-white">
                            {month.totalQuantidade}
                          </td>
                          <td className="p-3 font-mono text-right text-slate-300">
                            {formatKz(month.totalValor)}
                          </td>
                          <td className="p-3 font-mono text-right text-yellow-400">
                            +{formatKz(month.totalBonus)}
                          </td>
                          <td className="p-3 font-mono text-right text-sky-400 font-black text-sm">
                            {formatKz(month.totalFinal)}
                          </td>
                          <td colSpan={userRole === 'admin' ? 2 : 1}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Confirmação para Eliminar Cliente */}
      {confirmDeleteCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-rose-900/60 bg-[#0c1322] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Eliminar Cliente</h4>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem a certeza de que deseja eliminar o cliente <strong className="text-white font-bold">{customer.nome}</strong>?
              {customer.salesCount && customer.salesCount > 0 ? (
                <span className="block mt-2 rounded-xl border border-rose-800/50 bg-rose-950/40 p-2.5 text-rose-300 font-medium">
                  Atenção: Este cliente possui <strong className="text-white">{customer.salesCount} venda(s)</strong> registada(s) que também serão eliminadas permanentemente.
                </span>
              ) : null}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                disabled={deletingCustomer}
                onClick={() => setConfirmDeleteCustomer(false)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingCustomer}
                onClick={handleDeleteCustomer}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {deletingCustomer ? 'A eliminar...' : 'Sim, Eliminar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
