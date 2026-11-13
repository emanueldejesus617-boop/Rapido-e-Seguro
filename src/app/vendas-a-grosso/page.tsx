'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  ShoppingBag,
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Calendar,
  Building2,
  TrendingUp,
  Gift,
  ArrowRight,
  Menu,
  Store,
  Clock,
  Sparkles,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Package,
  Trash2,
} from 'lucide-react';
import { formatKz, formatDatePt } from '@/lib/utils';
import { AuthUser, WholesaleCustomer, WholesaleSummary } from '@/types';
import { NewCustomerModal } from '@/components/wholesale/NewCustomerModal';
import { NewSaleModal } from '@/components/wholesale/NewSaleModal';
import { CustomerDetailDrawer } from '@/components/wholesale/CustomerDetailDrawer';
import { getProductConfig } from '@/components/wholesale/wholesaleConfig';
import { HeaderInstallButton } from '@/components/InstallPwaButton';

function WholesaleContent() {
  const router = useRouter();

  // Estados principais
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dados de clientes e métricas
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [summary, setSummary] = useState<WholesaleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modais e gaveta
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<WholesaleCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<WholesaleCustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Autenticação e Postos
  useEffect(() => {
    const initAuth = async () => {
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
    initAuth();
  }, [router]);

  // 2. Carregar lista de clientes e resumo
  const loadData = async () => {
    try {
      setLoading(true);
      const [resCustomers, resSummary] = await Promise.all([
        fetch('/api/wholesale/customers'),
        fetch('/api/wholesale/summary'),
      ]);

      if (resCustomers.ok) {
        const cData = await resCustomers.json();
        setCustomers(cData.customers || []);
      }
      if (resSummary.ok) {
        const sData = await resSummary.json();
        setSummary(sData.summary || null);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de vendas a grosso:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Atualizar cliente selecionado quando houver alterações
  const reloadSelectedCustomer = async (customerId: string) => {
    try {
      const res = await fetch(`/api/wholesale/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data.customer);
      }
    } catch (e) {
      console.error('Erro ao recarregar cliente:', e);
    }
  };

  // Clientes filtrados por busca textual
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const term = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        (c.telefone && c.telefone.toLowerCase().includes(term)) ||
        (c.localizacao && c.localizacao.toLowerCase().includes(term))
    );
  }, [customers, search]);

  // Handlers
  const handleCustomerCreated = (newCust: any) => {
    setFeedback({ type: 'success', message: `Cliente "${newCust.nome}" cadastrado com sucesso!` });
    loadData();
  };

  const handleSaleCreated = (newSale: any) => {
    setFeedback({ type: 'success', message: 'Venda a grosso registada com sucesso!' });
    loadData();
    if (selectedCustomer) {
      reloadSelectedCustomer(selectedCustomer.id);
    }
  };

  const handleSaleDeleted = (saleId: string) => {
    setFeedback({ type: 'success', message: 'Registo de venda removido com sucesso!' });
    loadData();
    if (selectedCustomer) {
      reloadSelectedCustomer(selectedCustomer.id);
    }
  };

  const handleCustomerDeleted = (customerId: string) => {
    setFeedback({ type: 'success', message: 'Cliente eliminado com sucesso!' });
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(null);
    }
    loadData();
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setDeletingCustomer(true);
      const res = await fetch(`/api/wholesale/customers/${customerToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao eliminar cliente');
      }
      setFeedback({ type: 'success', message: `Cliente "${customerToDelete.nome}" eliminado com sucesso!` });
      if (selectedCustomer?.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }
      setCustomerToDelete(null);
      loadData();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Erro ao eliminar cliente' });
    } finally {
      setDeletingCustomer(false);
    }
  };

  const handleOpenCustomer = async (cust: WholesaleCustomer) => {
    // Carregar detalhes completos com as vendas
    await reloadSelectedCustomer(cust.id);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pl-0 lg:pl-64 transition-all duration-300">
      {/* Sidebar */}
      <Sidebar
        user={user}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-200"
              aria-label="Abrir menu lateral"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <ShoppingBag className="text-sky-400" size={24} />
                  <span>Vendas a Grosso</span>
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-950/80 border border-sky-500/40 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                  <Sparkles size={11} /> CSA Atacado & Revenda
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Registo de clientes e lançamentos por produto (Afrivendas, Zap, Cartões, Africel, Unitel).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <HeaderInstallButton />

            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 px-4 sm:px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-950/60 hover:from-sky-500 hover:to-blue-500 transition active:scale-95 shrink-0"
            >
              <Plus size={16} />
              <span>Novo Cliente</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`rounded-2xl p-3.5 text-xs font-medium flex items-center justify-between gap-2 shadow-lg transition animate-in fade-in ${
              feedback.type === 'success'
                ? 'border border-sky-500/50 bg-sky-950/70 text-sky-200'
                : 'border border-rose-500/50 bg-rose-950/70 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-sky-400 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
        )}

        {/* KPIs de Vendas a Grosso */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Faturado */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Volume Faturado</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black font-mono text-sky-400">
              {formatKz(summary?.totalRevenue || 0)}
            </div>
            <div className="text-[11px] text-slate-500">
              {summary?.totalSalesCount || 0} lançamentos efetuados
            </div>
          </div>

          {/* Clientes Cadastrados */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Clientes Ativos</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users size={16} />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black font-mono text-white">
              {summary?.totalCustomers || customers.length}
            </div>
            <div className="text-[11px] text-slate-500">
              Cadastrados para revenda
            </div>
          </div>

          {/* Bónus Distribuído */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total de Bónus</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Gift size={16} />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black font-mono text-yellow-400">
              +{formatKz(summary?.totalBonus || 0)}
            </div>
            <div className="text-[11px] text-slate-500">
              Comissões e margens atribuídas
            </div>
          </div>

          {/* Produto Líder */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 sm:p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Produto Líder</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Package size={16} />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold text-white truncate">
              {summary?.topProduct ? getProductConfig(summary.topProduct.produto).label : '—'}
            </div>
            <div className="text-[11px] font-mono text-sky-400">
              {summary?.topProduct ? `${formatKz(summary.topProduct.totalVendido)} (${summary.topProduct.quantidade} un)` : 'Sem vendas'}
            </div>
          </div>
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0d1424] p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar cliente por nome, telefone ou localidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-[#070b14] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto">
            <span>Mostrando <strong className="text-white">{filteredCustomers.length}</strong> de <strong className="text-white">{customers.length}</strong> clientes</span>
          </div>
        </div>

        {/* Lista de Clientes */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <span className="text-xs text-slate-400">A carregar clientes de atacado CSA...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed border-slate-800 bg-[#0d1424]/60 p-8 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Users size={26} />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum cliente encontrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {search.trim()
                ? `Nenhum resultado para "${search}". Tente buscar por outro termo.`
                : 'Ainda não foram cadastrados clientes para vendas a grosso. Comece agora!'}
            </p>
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:from-sky-500 hover:to-blue-500 transition shadow-lg shadow-sky-950/60"
            >
              <Plus size={16} />
              <span>Cadastrar Primeiro Cliente</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                onClick={() => handleOpenCustomer(cust)}
                className="group relative rounded-3xl border border-slate-800 bg-[#0d1424] p-5 shadow-xl transition-all duration-200 hover:border-sky-500/50 hover:bg-[#0f1932] hover:shadow-2xl hover:shadow-sky-950/30 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-700/20 text-sky-400 border border-sky-500/30 font-black text-lg group-hover:scale-105 transition-transform">
                        {cust.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                          {cust.nome}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(cust);
                          setIsNewSaleModalOpen(true);
                        }}
                        className="flex h-8 items-center gap-1 rounded-xl bg-sky-500/10 border border-sky-500/20 px-2.5 text-[11px] font-bold text-sky-400 hover:bg-sky-500 hover:text-white transition"
                        title="Lançar nova venda direta"
                      >
                        <Plus size={13} />
                        <span>Venda</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerToDelete(cust);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white transition"
                        title="Eliminar cliente"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    {cust.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-sky-400 shrink-0" />
                        <span className="font-mono text-slate-300">{cust.telefone}</span>
                      </div>
                    )}
                    {cust.localizacao && (
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-slate-500 shrink-0" />
                        <span className="truncate">{cust.localizacao}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Comprado</span>
                    <span className="font-mono font-extrabold text-sky-400">
                      {formatKz(cust.totalSpent || 0)}
                    </span>
                  </div>

                  <div className="text-right flex items-center gap-1.5 text-slate-400 group-hover:text-sky-300 transition">
                    <span className="text-[11px] font-semibold">
                      {cust.salesCount ? `${cust.salesCount} vendas` : 'Sem vendas'}
                    </span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Novo Cliente */}
      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onCreated={handleCustomerCreated}
      />

      {/* Modal: Nova Venda a Grosso */}
      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
        customer={selectedCustomer}
        onSaleCreated={handleSaleCreated}
      />

      {/* Gaveta / Detalhes do Cliente */}
      <CustomerDetailDrawer
        isOpen={Boolean(selectedCustomer) && !isNewSaleModalOpen}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onOpenNewSale={() => setIsNewSaleModalOpen(true)}
        onSaleDeleted={handleSaleDeleted}
        onCustomerDeleted={handleCustomerDeleted}
        userRole={user?.role}
      />

      {/* Modal de Confirmação para Eliminar Cliente */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
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
              Tem a certeza de que deseja eliminar o cliente <strong className="text-white font-bold">{customerToDelete.nome}</strong>?
              {customerToDelete.salesCount && customerToDelete.salesCount > 0 ? (
                <span className="block mt-2 rounded-xl border border-rose-800/50 bg-rose-950/40 p-2.5 text-rose-300 font-medium">
                  Atenção: Este cliente possui <strong className="text-white">{customerToDelete.salesCount} venda(s)</strong> registada(s) que também serão eliminadas permanentemente.
                </span>
              ) : null}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                disabled={deletingCustomer}
                onClick={() => setCustomerToDelete(null)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingCustomer}
                onClick={handleConfirmDeleteCustomer}
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

export default function WholesalePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <span className="text-xs text-slate-400">A carregar Vendas a Grosso...</span>
          </div>
        </div>
      }
    >
      <WholesaleContent />
    </Suspense>
  );
}

