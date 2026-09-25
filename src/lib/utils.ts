import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um número no padrão monetário de Angola (Kwanza - Kz)
 * Ex: 1250000 -> "1.250.000 Kz"
 * Ex: 25000.5 -> "25.000,50 Kz"
 */
export function formatKz(value: number | string | null | undefined, showDecimals: boolean = false): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return `0 Kz`;
  }

  const num = Number(value);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: showDecimals ? 2 : (absNum % 1 !== 0 ? 2 : 0),
    maximumFractionDigits: 2,
  }).format(absNum);

  return `${isNegative ? '-' : ''}${formatted} Kz`;
}

/**
 * Retorna a data atual no formato YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna a hora atual no formato HH:mm
 */
export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formata uma data YYYY-MM-DD para formato amigável em Português
 * Ex: 2026-08-22 -> 22/08/2026
 */
export function formatDatePt(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
