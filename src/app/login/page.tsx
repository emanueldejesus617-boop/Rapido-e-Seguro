'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  TrendingUp,
  BarChart3,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { HeaderInstallButton } from '@/components/InstallPwaButton';

const FEATURES = [
  { icon: TrendingUp, label: 'Controlo diário de caixa em tempo real' },
  { icon: BarChart3, label: 'Relatórios semanais e mensais automáticos' },
  { icon: FileText, label: 'Substituição total dos cadernos em papel' },
  { icon: CheckCircle2, label: 'Fecho de relatórios com auditoria digital' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Falha na autenticação. Verifique os dados.');
        setLoading(false);
        return;
      }

      // Redirecionamento completo para garantir atualização dos cookies no browser
      window.location.href = '/';
    } catch {
      setError('Erro de rede ao conectar com o servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#060911]">
      {/* Botão de Instalar App no canto superior */}
      <div className="absolute top-4 right-4 z-30">
        <HeaderInstallButton />
      </div>

      {/* ── LEFT PANEL (Hero / Branding) — hidden on mobile ── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between bg-gradient-to-br from-[#031a10] via-[#06150d] to-[#060911] border-r border-emerald-900/30 p-12 overflow-hidden">

        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-emerald-600/15 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-emerald-400/8 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/6 blur-[100px]" />

        {/* Top brand mark */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl shadow-emerald-950/80 ring-1 ring-emerald-400/30">
            <Zap size={26} className="fill-white text-white" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white">Rápido e Seguro</div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Gestão de Vendas</div>
          </div>
        </div>

        {/* Central hero content */}
        <div className="relative space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-4 py-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Plataforma Profissional
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight text-white">
              Controlo total<br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                do seu caixa
              </span>
            </h1>
            <p className="mt-5 text-sm text-slate-300 leading-relaxed max-w-sm">
              Substitua os cadernos em papel pelo sistema digital de fecho de caixa, relatórios e auditoria da Rápido e Seguro.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3.5">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                  <Icon size={16} />
                </div>
                <span className="text-xs font-medium text-slate-300">{label}</span>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            {[
              { value: '100%', label: 'Sem papel' },
              { value: '6', label: 'Canais de venda' },
              { value: '24/7', label: 'Disponível' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl font-extrabold text-emerald-400">{value}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom caption — EMANUS */}
        <div className="relative space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-800/80" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Desenvolvido por</span>
            <div className="h-px flex-1 bg-slate-800/80" />
          </div>
          <div className="text-center">
            <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">EMANUS</span>
            <div className="text-[10px] text-slate-600 mt-0.5">Emanuel De Jesus</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Login Form) ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-10">

        {/* Mobile-only ambient glow */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-rose-600/5 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-sm space-y-8">

          {/* Mobile brand mark */}
          <div className="flex lg:hidden flex-col items-center text-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl shadow-emerald-950/70 ring-1 ring-emerald-400/30">
              <Zap size={34} className="fill-white text-white" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-white mt-3">Rápido e Seguro</div>
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Gestão de Vendas</div>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0c1120]/80 p-7 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">

            {/* Form heading */}
            <div className="mb-7">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Entrar na plataforma
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Aceda ao sistema de fecho de caixa e relatórios diários.
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-800/50 bg-rose-950/40 p-3.5 text-xs text-rose-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Email do Utilizador
                </label>
                <div className={`relative rounded-xl border transition-all duration-200 ${
                  focused === 'email'
                    ? 'border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                    : 'border-slate-800 hover:border-slate-700'
                } bg-[#070b14]`}>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="vendedor@rapidoeseguro.ao"
                    autoComplete="email"
                    className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Palavra-passe
                </label>
                <div className={`relative rounded-xl border transition-all duration-200 ${
                  focused === 'password'
                    ? 'border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                    : 'border-slate-800 hover:border-slate-700'
                } bg-[#070b14]`}>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-transparent py-3 pl-10 pr-11 text-sm text-white placeholder-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/60 transition-all duration-200 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-900/60 hover:shadow-xl disabled:opacity-60 active:scale-[0.98]"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>A autenticar...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* EMANUS Signature (mobile/right panel) */}
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <div className="flex items-center gap-2 w-full">
              <div className="h-px flex-1 bg-slate-800/60" />
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-700">Desenvolvido por</span>
              <div className="h-px flex-1 bg-slate-800/60" />
            </div>
            <span className="text-xs font-extrabold tracking-widest text-slate-500 uppercase">EMANUS</span>
            <p className="text-[10px] text-slate-700 text-center">Emanuel De Jesus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
