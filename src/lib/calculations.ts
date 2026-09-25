/**
 * MOTOR DE CÁLCULO FINANCEIRO - RÁPIDO E SEGURO
 * Regra de Negócio:
 * Resultado Líquido = Vendas + Lucros (+ Bónus AKI, se houver) − Total Saídas
 * Onde Lucros é a soma de todos os lucros (taxas) de todos os canais de venda.
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
  lucro_do_aki_bonus: number;
  lucro_operacional: number;
  saidas: ExpenseInput[];
  total_saidas: number;
  total_final: number;
  total_final_sem_bonus: number;
}

/**
 * 1. Lucro Parcial / Total Arrecadado por canal:
 * As taxas são valores ACRESCENTADOS pelo serviço.
 * lucro_parcial = valor_vendido + taxa
 */
export function calculateChannelProfit(valorVendido: number, taxa: number = 0): number {
  const v = Number(valorVendido) || 0;
  const t = Number(taxa) || 0;
  return v + t; // Taxa é acrescentada, não subtraída
}

/**
 * 2. Lucro Operacional do Dia:
 * soma de todos os ganhos (vendas + taxas acrescentadas) + bónus
 */
export function calculateOperationalProfit(
  somaLucrosParciais: number,
  akiBonus: number = 0
): number {
  const lucros = Number(somaLucrosParciais) || 0;
  const bonus = Number(akiBonus) || 0;
  return lucros + bonus;
}

/**
 * 3. Saídas do dia:
 * total_saidas = soma de todas as despesas
 */
export function calculateTotalExpenses(expenses: ExpenseInput[]): number {
  if (!Array.isArray(expenses)) return 0;
  return expenses.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
}

/**
 * 4. Total Final do Dia (Resultado Líquido Real de Caixa):
 * Regra: resultado liquido = vendas + lucros (+ bonusAki se houver) - total_saidas
 * Onde lucros é a soma de todos os lucros (taxas) de todos os canais.
 */
export function calculateFinalTotal(
  totalVendas: number,
  totalLucros: number,
  totalSaidas: number,
  akiBonus: number = 0
): number {
  const totalGanhos = (Number(totalVendas) || 0) + (Number(totalLucros) || 0) + (Number(akiBonus) || 0);
  const saidas = Number(totalSaidas) || 0;
  return totalGanhos - saidas;
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

  const canaisProcessados: ChannelResult[] = channels.map((c) => {
    const valor = Number(c.valor_vendido) || 0;
    const taxa = Number(c.taxa) || 0;
    const lucro = calculateChannelProfit(valor, taxa); // soma: valor + taxa

    totalVendasBrutas += valor;
    totalTaxas += taxa;
    somaLucrosParciais += lucro;

    if (c.canal === 'aki') {
      recargaAkiLucro += taxa;
    }

    return {
      canal: c.canal,
      valor_vendido: valor,
      taxa: taxa,
      lucro_parcial: lucro,
    };
  });

  const bonusAki = Number(akiBonus) || 0;
  const lucroOperacional = calculateOperationalProfit(somaLucrosParciais, bonusAki);
  const totalSaidas = calculateTotalExpenses(expenses);
  
  // Total SEM bónus do Aki: (Vendas + Soma de todos os Lucros) - Saídas
  const totalFinalSemBonus = (totalVendasBrutas + totalTaxas) - totalSaidas;
  
  // Total COM bónus do Aki: (Vendas + Soma de todos os Lucros + Bónus Aki) - Saídas
  const totalFinal = calculateFinalTotal(totalVendasBrutas, totalTaxas, totalSaidas, bonusAki);

  return {
    canais: canaisProcessados,
    soma_lucros_parciais: somaLucrosParciais,
    total_vendas_brutas: totalVendasBrutas,
    total_taxas_acrescentadas: totalTaxas,
    recarga_aki_lucro: recargaAkiLucro,
    lucro_do_aki_bonus: bonusAki,
    lucro_operacional: lucroOperacional,
    saidas: expenses,
    total_saidas: totalSaidas,
    total_final: totalFinal,
    total_final_sem_bonus: totalFinalSemBonus,
  };
}
