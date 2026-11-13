'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, ShoppingBag, Calendar, Package, Hash, DollarSign, Gift, Calculator, AlertCircle, Loader2 } from 'lucide-react';
import { WHOLESALE_PRODUCTS, getProductConfig } from './wholesaleConfig';
import { formatKz, getTodayDateString } from '@/lib/utils';
import { WholesaleCustomer } from '@/types';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: WholesaleCustomer | null;
  onSaleCreated: (sale: any) => void;
}

export function NewSaleModal({
  isOpen,
  onClose,
  customer,
  onSaleCreated,
}: NewSaleModalProps) {
  const [data, setData] = useState(getTodayDateString());
  const [produto, setProduto] = useState<string>(WHOLESALE_PRODUCTS[0].id);
  const [quantidade, setQuantidade] = useState<string>('1');
  const [valor, setValor] = useState<string>('');
  const [bonus, setBonus] = useState<string>('0');
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-preencher valor padrão quando o produto mudar (ex: cartões de 500 e 200)
  useEffect(() => {
    const cfg = getProductConfig(produto);
    if (cfg.defaultValor > 0) {
      setValor(String(cfg.defaultValor));
    }
  }, [produto]);

  // Cálculo dinâmico do total: TOTAL = VENDAS + BÓNUS
  const totalCalculado = useMemo(() => {
    const val = parseFloat(valor) || 0;
    const bns = parseFloat(bonus) || 0;
    return val + bns;
  }, [valor, bonus]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtdNum = parseFloat(quantidade) || 0;
    const valNum = parseFloat(valor) || 0;
    const bnsNum = parseFloat(bonus) || 0;

    if (qtdNum <= 0) {
      setError('A quantidade deve ser maior que zero');
      return;
    }
    if (valNum < 0) {
      setError('O valor não pode ser negativo');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/wholesale/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          data,
          produto,
          quantidade: qtdNum,
          valor: valNum,
          bonus: bnsNum,
          total: totalCalculado,
          observacoes: observacoes.trim() || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Falha ao registar venda');

      onSaleCreated(resData.sale);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao registar venda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0c1322] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nova Venda a Grosso</h3>
              <p className="text-xs text-slate-400">
                Cliente: <span className="text-sky-400 font-semibold">{customer.nome}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/50 bg-rose-950/70 p-3 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Data */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>Data da Venda</span>
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#070b14] px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Produto */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Package size={13} className="text-slate-400" />
                <span>Produto</span>
              </label>
              <select
                value={produto}
                onChange={(e) => setProduto(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#070b14] px-3.5 py-2.5 text-xs font-bold text-white focus:border-sky-500 focus:outline-none cursor-pointer"
              >
                {WHOLESALE_PRODUCTS.map((prod) => (
                  <option key={prod.id} value={prod.id} className="bg-slate-900 text-white">
                    {prod.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Quantidade */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Hash size={13} className="text-slate-400" />
                <span>Quantidade</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#070b14] px-3.5 py-2.5 text-xs font-mono font-semibold text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Valor Total das Vendas */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                <DollarSign size={13} className="text-slate-400" />
                <span>Valor das Vendas (Kz)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="0 Kz"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#070b14] px-3.5 py-2.5 text-xs font-mono font-semibold text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Bónus */}
            <div>
              <label className="text-xs font-semibold text-sky-400 block mb-1 flex items-center gap-1.5">
                <Gift size={13} className="text-sky-400" />
                <span>+ Bónus (Kz)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0 Kz"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="w-full rounded-xl border border-sky-900/70 bg-[#070b14] px-3.5 py-2.5 text-xs font-mono font-semibold text-sky-300 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Destaque do Total Calculado */}
          <div className="rounded-2xl border border-sky-800/60 bg-gradient-to-br from-sky-950/40 via-[#070b14] to-[#071328] p-4 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Calculator size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total da Venda
                </span>
                <span className="text-[10px] text-slate-500">
                  Vendas + Bónus
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-sky-400">
                {formatKz(totalCalculado)}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Pagamento por transferência Express ou entregue em mãos"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#070b14] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-950/60 hover:from-sky-500 hover:to-blue-500 transition active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>A guardar venda...</span>
                </>
              ) : (
                <span>Confirmar Venda</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

