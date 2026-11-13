'use client';

import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customer: any) => void;
}

export function NewCustomerModal({
  isOpen,
  onClose,
  onCreated,
}: NewCustomerModalProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor informe o nome do cliente');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/wholesale/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          localizacao: localizacao.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao registar cliente');

      setNome('');
      setTelefone('');
      setLocalizacao('');
      onCreated(data.customer);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao registar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0c1322] p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cadastrar Novo Cliente</h3>
              <p className="text-xs text-slate-400">CSA Vendas a Grosso / Atacado</p>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nome */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome do Cliente / Empresa <span className="text-sky-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: João Silva ou Cantina Central"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#070b14] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400" />
              <span>Telefone / WhatsApp</span>
            </label>
            <input
              type="tel"
              placeholder="Ex: 923 000 000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#070b14] px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Localização */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-slate-400" />
              <span>Localização / Zona</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Mercado do Catinton, Luanda"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#070b14] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Ações */}
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
                  <span>A cadastrar...</span>
                </>
              ) : (
                <span>Cadastrar Cliente</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

