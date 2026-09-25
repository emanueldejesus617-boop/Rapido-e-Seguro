'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Laptop, CheckCircle, Share2, PlusSquare, X, ArrowDown } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone (installed PWA) mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Check iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Capture standard PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (onNeedsInstructions?: () => void) => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Erro ao acionar instalação:', err);
        if (onNeedsInstructions) onNeedsInstructions();
      }
    } else {
      // If iOS or prompt not available, show helpful modal
      if (onNeedsInstructions) onNeedsInstructions();
    }
  };

  return {
    deferredPrompt,
    isInstalled,
    isIos,
    isStandalone,
    triggerInstall,
  };
}

/** Modal de Instruções de Instalação para iOS & Outros Browsers */
export const InstallHelpModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isIos: boolean;
}> = ({ isOpen, onClose, isIos }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c121e] p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-950/60">
            <Download size={24} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Instalar App no Dispositivo</h3>
            <p className="text-xs text-emerald-400 font-medium">Rápido e Seguro — Vendas</p>
          </div>
        </div>

        {isIos ? (
          <div className="space-y-3.5 text-xs text-slate-300">
            <p className="text-slate-300 leading-relaxed">
              Para instalar este aplicativo no seu <strong className="text-white">iPhone ou iPad</strong>:
            </p>

            <div className="space-y-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                  1
                </span>
                <div>
                  No Safari, toque no ícone de <strong className="text-white">Partilha</strong> (ícone de quadrado com seta para cima na barra inferior).
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                  2
                </span>
                <div>
                  Deslize o menu para baixo e toque em <strong className="text-white">&quot;Ecrã Principal&quot;</strong> (ou &quot;Add to Home Screen&quot;).
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                  3
                </span>
                <div>
                  Toque em <strong className="text-white">&quot;Adicionar&quot;</strong> no canto superior direito para concluir.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              O aplicativo pode ser instalado diretamente no seu celular <strong className="text-white">Android</strong> ou no seu <strong className="text-white">Computador (Windows / Mac)</strong>:
            </p>

            <div className="space-y-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5">
              <div className="flex items-start gap-3">
                <Smartphone size={18} className="shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <strong className="text-white">No Celular Android:</strong> Toque no menu do navegador (3 pontos ⋮) e escolha <strong className="text-white">&quot;Instalar aplicativo&quot;</strong> ou &quot;Adicionar ao ecrã inicial&quot;.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Laptop size={18} className="shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <strong className="text-white">No Computador (Chrome/Edge):</strong> Clique no ícone de instalação (<Download size={12} className="inline text-emerald-400" />) na barra de endereço do navegador.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-95 transition"
          >
            Entendi, fechar
          </button>
        </div>
      </div>
    </div>
  );
};

/** Botão compacto para Cabeçalho / Navbar */
export const HeaderInstallButton: React.FC = () => {
  const { deferredPrompt, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const [modalOpen, setModalOpen] = useState(false);

  if (isInstalled) {
    return null; // Don't show if already running inside installed app
  }

  const handleClick = () => {
    triggerInstall(() => setModalOpen(true));
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Baixar e Instalar Aplicativo no Dispositivo"
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-white hover:border-emerald-400 transition-all duration-200 active:scale-95 group shadow-sm shadow-emerald-950/40"
      >
        <Download size={14} className="text-emerald-400 group-hover:scale-110 group-hover:translate-y-0.5 transition-transform" />
        <span>Baixar App</span>
      </button>

      <InstallHelpModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isIos={isIos}
      />
    </>
  );
};

/** Card Banner para Barra Lateral (Sidebar) */
export const SidebarInstallCard: React.FC = () => {
  const { deferredPrompt, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const [modalOpen, setModalOpen] = useState(false);

  if (isInstalled) {
    return (
      <div className="mx-2 mb-2 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-2.5 text-[11px] text-emerald-300 flex items-center gap-2">
        <CheckCircle size={15} className="text-emerald-400 shrink-0" />
        <span className="font-medium truncate">App Instalado no Dispositivo</span>
      </div>
    );
  }

  const handleClick = () => {
    triggerInstall(() => setModalOpen(true));
  };

  return (
    <>
      <div className="mx-2 mb-2 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 via-slate-900/60 to-slate-900/90 p-3 shadow-lg shadow-emerald-950/30 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Download size={14} className="animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">Instalar Aplicativo</div>
            <div className="text-[10px] text-emerald-400">Acesso rápido &amp; offline</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
          Tenha a Rápido e Seguro no ecrã inicial do seu telemóvel ou computador.
        </p>

        <button
          onClick={handleClick}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/60 hover:bg-emerald-500 active:scale-95 transition-all"
        >
          <Download size={13} />
          <span>Baixar / Instalar App</span>
        </button>
      </div>

      <InstallHelpModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isIos={isIos}
      />
    </>
  );
};
