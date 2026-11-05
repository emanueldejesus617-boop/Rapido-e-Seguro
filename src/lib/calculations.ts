/**
 * MOTOR DE CÁLCULO FINANCEIRO - RÁPIDO E SEGURO
 * Regra de Negócio:
 * Os únicos bónus incluídos no total diário são:
 * + Bónus AKI (lucro/comissão da Recarga AKI + Bónus AKI extra se houver)
 * + Bónus ZAP (lucro/comissão da ZAP Directo)
 * Resultado Líquido Diário = Vendas Brutas + Bónus AKI + Bónus ZAP (− Saídas)
 */

export interface ChannelInput {
  canal: 'aki' | 'afrivendas' | 'zap' | 'unitel' | 'cartoes' | 'chips' | string;
  valor_vendido: number;
  taxa?: number;
}

export interface ChannelResult extends ChannelInput {
  taxa: number;
  lucro_parcial: number;
}

export interface ExpenseInput {
  categoria: 'renda' | 'saldo' | 'taxi' | 'outros' | string;
  descricao: string;
  valor: number;
}

export interface CalculationResult {
  canais: ChannelResult[];
  soma_lucros_parciais: number;
  total_vendas_brutas: number;
  total_taxas_acrescentadas: number;
  recarga_aki_lucro: number;
  zap_lucro: number;
  lucro_do_aki_bonus: number;
  lucro_operacional: number;
  saidas: ExpenseInput[];
  total_saidas: number;
  total_final: number;
  total_final_sem_bonus: number;
}

/**
 * 1. Lucro Parcial / Total Arrecadado por canal:
 * As taxas são valores ACRESCENTADOS pelo serviço (ganho/comissão do serviço).
 * lucro_parcial = valor_vendido + taxa
 */
export function calculateChannelProfit(valorVendido: number, taxa: number = 0): number {
  const v = Number(valorVendido) || 0;
  const t = Number(taxa) || 0;
  return v + t; // Taxa é acrescentada, somando ao total arrecadado
}

/**
 * 2. Lucro Operacional do Dia:
 * Bónus AKI + Bónus ZAP (+ Bónus AKI extra se houver)
 */
export function calculateOperationalProfit(
  recargaAkiLucro: number = 0,
  zapLucro: number = 0,
  akiBonusExtra: number = 0
): number {
  return (Number(recargaAkiLucro) || 0) + (Number(zapLucro) || 0) + (Number(akiBonusExtra) || 0);
}

/**
 * 3. Saídas do dia:
 * total_saidas = soma de todas as despesas operacionais
 */
export function calculateTotalExpenses(expenses: ExpenseInput[]): number {
  if (!Array.isArray(expenses)) return 0;
  return expenses.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
}

/**
 * 4. Total Final do Dia (Resultado Líquido Real de Caixa):
 * Regra Oficial: Os únicos bónus incluídos no total diário são:
 * + Bónus AKI (recarga_aki_lucro + bónus extra) e + Bónus ZAP (zap_lucro).
 * Total Final = Vendas Brutas + Bónus AKI + Bónus ZAP − Saídas
 */
export function calculateFinalTotal(
  totalVendas: number,
  recargaAkiLucro: number,
  zapLucro: number,
  totalSaidas: number,
  akiBonus: number = 0
): number {
  const ganhos = (Number(totalVendas) || 0) + (Number(recargaAkiLucro) || 0) + (Number(zapLucro) || 0) + (Number(akiBonus) || 0);
  const saidas = Number(totalSaidas) || 0;
  return ganhos - saidas;
}

/**
 * Executa todos os cálculos consolidados para o relatório diário
 */
export function calculateDailyReport(
  channels: ChannelInput[],
  akiBonus: number = 0,
  expenses: ExpenseInput[] = []
): CalculationResult {
  let totalVendasBrutas = 0;
  let totalTaxas = 0;
  let somaLucrosParciais = 0;
  let recargaAkiLucro = 0;
  let zapLucro = 0;

  const canaisProcessados: ChannelResult[] = channels.map((c) => {
    const valor = Number(c.valor_vendido) || 0;
    const taxa = Number(c.taxa) || 0;
    const lucro = calculateChannelProfit(valor, taxa); // soma: valor + taxa (total arrecadado)

    totalVendasBrutas += valor;
    totalTaxas += taxa;
    somaLucrosParciais += lucro;

    if (c.canal === 'aki') {
      recargaAkiLucro += taxa;
    }
    if (c.canal === 'zap') {
      zapLucro += taxa;
    }

    return {
      canal: c.canal,
      valor_vendido: valor,
      taxa: taxa,
      lucro_parcial: lucro,
    };
  });

  const bonusAki = Number(akiBonus) || 0;
  const lucroOperacional = calculateOperationalProfit(recargaAkiLucro, zapLucro, bonusAki);
  const totalSaidas = calculateTotalExpenses(expenses);
  
  // Total do dia SEM bónus extra do Aki: (Vendas + Bónus AKI da recarga + Bónus ZAP) - Saídas
  const totalFinalSemBonus = calculateFinalTotal(totalVendasBrutas, recargaAkiLucro, zapLucro, totalSaidas, 0);

  // Total do dia COM bónus AKI e ZAP (incluindo bónus AKI extra se houver):
  const totalFinal = calculateFinalTotal(totalVendasBrutas, recargaAkiLucro, zapLucro, totalSaidas, bonusAki);

  return {
    canais: canaisProcessados,
    soma_lucros_parciais: somaLucrosParciais,
    total_vendas_brutas: totalVendasBrutas,
    total_taxas_acrescentadas: totalTaxas,
    recarga_aki_lucro: recargaAkiLucro,
    zap_lucro: zapLucro,
    lucro_do_aki_bonus: bonusAki,
    lucro_operacional: lucroOperacional,
    saidas: expenses,
    total_saidas: totalSaidas,
    total_final: totalFinal,
    total_final_sem_bonus: totalFinalSemBonus,
  };
}
