'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'dark' | 'light' | 'auto';
}

export function BrandLogo({
  size = 'md',
  showText = true,
  className = '',
  variant = 'dark',
}: BrandLogoProps) {
  const dimensions = {
    sm: { img: 28, textClass: 'text-xs' },
    md: { img: 38, textClass: 'text-sm' },
    lg: { img: 48, textClass: 'text-base' },
    xl: { img: 64, textClass: 'text-lg' },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Símbolo do Logo (Smartphone com Fluido Azul CSA) */}
      <div
        className="relative overflow-hidden rounded-2xl bg-white p-1 shadow-lg shadow-sky-950/40 ring-1 ring-sky-400/40 shrink-0 flex items-center justify-center transition-transform hover:scale-105"
        style={{ width: dimensions.img + 8, height: dimensions.img + 8 }}
      >
        <Image
          src="/images/logo.png"
          alt="CSA - Rápido e Seguro"
          width={dimensions.img}
          height={dimensions.img}
          className="object-contain"
          priority
        />
      </div>

      {/* Tipografia da Marca Oficial */}
      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1 font-black tracking-tight">
            <span className="text-sky-400 font-extrabold tracking-wide">CSA</span>
            <span className="text-slate-400 font-normal">·</span>
            <span className="text-white font-extrabold">Rápido e Seguro</span>
          </div>
          <div className="text-[10px] font-bold text-sky-400/90 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Gestão & Atacado
          </div>
        </div>
      )}
    </div>
  );
}

