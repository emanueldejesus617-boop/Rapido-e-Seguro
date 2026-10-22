import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlyReport, DailyReport } from '@/types';
import { formatKz, formatDatePt } from '@/lib/utils';

interface GenerateMonthlyPdfParams {
  month: MonthlyReport;
  reports?: DailyReport[];
  userName?: string;
  postoName?: string;
}

/**
 * Cria a instância do documento PDF preenchida com os dados consolidados do mês
 */
export function createMonthlyReportPdfDoc({
  month,
  reports = [],
  userName = 'Utilizador do Sistema',
  postoName = 'Todos os Postos',
}: GenerateMonthlyPdfParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // ─── 1. CABEÇALHO INSTITUCIONAL ───
  // Faixa superior verde esmeralda
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Detalhe decorativo dourado / esmeralda claro
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Nome da Empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('RÁPIDO E SEGURO', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229); // emerald-100
  doc.text('Sistema Integrado de Gestão de Vendas e Tesouraria', margin, 18);

  // Mês e Ano em destaque no canto superior direito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(month.label.toUpperCase(), pageWidth - margin, 12, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  const now = new Date();
  const dataEmissao = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  doc.text(`Emitido em: ${dataEmissao}`, pageWidth - margin, 18, { align: 'right' });

  currentY = 34;

  // ─── 2. DADOS DO RELATÓRIO ───
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'bold');
  doc.text('Posto(s):', margin + 4, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(postoName, margin + 20, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Emitido por:', margin + 4, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(userName, margin + 24, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Relatórios Registados:', pageWidth - margin - 60, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${month.reportCount} (${month.closedCount} fechados)`, pageWidth - margin - 22, currentY + 6);

  const lucroRatio = month.totalVendas > 0 ? (month.resultadoLiquido / month.totalVendas) * 100 : 0;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Margem Líquida:', pageWidth - margin - 60, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(month.resultadoLiquido >= 0 ? 5 : 225, month.resultadoLiquido >= 0 ? 150 : 29, month.resultadoLiquido >= 0 ? 105 : 72);
  doc.text(`${lucroRatio.toFixed(1)}%`, pageWidth - margin - 22, currentY + 11);

  currentY += 18;

  // ─── 3. CARDS DE INDICADORES (KPIS) ───
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 18;

  const kpis = [
    { label: 'TOTAL VENDAS', value: formatKz(month.totalVendas), color: [16, 120, 80], bg: [236, 253, 245] },
    { label: 'LUCRO (+TAXAS)', value: formatKz(month.totalLucro), color: [4, 120, 87], bg: [240, 253, 250] },
    { label: 'BÓNUS AKI', value: month.totalBonus > 0 ? `+${formatKz(month.totalBonus)}` : '0,00 Kz', color: [180, 83, 9], bg: [254, 252, 232] },
    { label: 'TOTAL SAÍDAS', value: formatKz(month.totalSaidas), color: [190, 18, 60], bg: [255, 241, 242] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + 3);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, currentY + 5.5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, currentY + 13.5);
  });

  currentY += cardHeight + 4;

  // ─── 4. DESTAQUE DO RESULTADO LÍQUIDO ───
  const isPositive = month.resultadoLiquido >= 0;
  const resBg = isPositive ? [236, 253, 245] : [255, 241, 242];
  const resBorder = isPositive ? [16, 185, 129] : [244, 63, 94];
  const resTextColor = isPositive ? [6, 95, 70] : [159, 18, 57];

  doc.setFillColor(resBg[0], resBg[1], resBg[2]);
  doc.setDrawColor(resBorder[0], resBorder[1], resBorder[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 17, 2, 2, 'FD');
  doc.setLineWidth(0.2); // reset

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(resTextColor[0], resTextColor[1], resTextColor[2]);
  doc.text('RESULTADO LÍQUIDO DO MÊS (Vendas + Lucro/Taxas + Bónus AKI - Saídas)', margin + 5, currentY + 7);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${isPositive ? '+' : ''}${formatKz(month.resultadoLiquido)}`,
    margin + 5,
    currentY + 13.5
  );

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Período de apuração referente ao mês completo de ${month.label}`,
    pageWidth - margin - 5,
    currentY + 11,
    { align: 'right' }
  );

  currentY += 21;

  // ─── 5. TABELA DE RELATÓRIOS DIÁRIOS ───
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DETALHAMENTO DIÁRIO DOS FECHOS E MOVIMENTAÇÕES', margin, currentY);

  currentY += 2;

  if (reports.length === 0) {
    // Caso não haja reports detalhados carregados, mostra tabela resumida por posto ou mensagem
    autoTable(doc, {
      startY: currentY,
      head: [['Mês de Referência', 'Total Vendas', 'Lucro (+Taxas)', 'Bónus AKI', 'Total Saídas', 'Resultado Líquido', 'Status']],
      body: [[
        month.label,
        formatKz(month.totalVendas),
        formatKz(month.totalLucro),
        month.totalBonus > 0 ? formatKz(month.totalBonus) : '—',
        formatKz(month.totalSaidas),
        formatKz(month.resultadoLiquido),
        `${month.closedCount}/${month.reportCount} fechados`,
      ]],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      margin: { left: margin, right: margin },
    });
  } else {
    // Tabela completa com cada dia do mês
    const sortedReports = [...reports].sort((a, b) => a.data.localeCompare(b.data));

    const tableBody = sortedReports.map((r) => [
      formatDatePt(r.data),
      r.posto?.nome || 'Principal',
      formatKz(r.total_vendas_brutas || 0),
      formatKz(r.total_taxas_acrescentadas || 0),
      r.aki_bonus?.valor ? formatKz(r.aki_bonus.valor) : '—',
      formatKz(r.total_saidas || 0),
      `${(r.total_final || 0) >= 0 ? '+' : ''}${formatKz(r.total_final || 0)}`,
      r.status === 'fechado' ? 'Fechado' : 'Rascunho',
    ]);

    // Linha de totais
    const tableFoot = [[
      `TOTAL (${sortedReports.length} dias)`,
      '—',
      formatKz(month.totalVendas),
      formatKz(month.totalLucro),
      month.totalBonus > 0 ? formatKz(month.totalBonus) : '—',
      formatKz(month.totalSaidas),
      `${isPositive ? '+' : ''}${formatKz(month.resultadoLiquido)}`,
      `${month.closedCount} fechados`,
    ]];

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Posto', 'Vendas (Kz)', 'Lucro/Taxa', 'Bónus', 'Saídas (Kz)', 'Líquido (Kz)', 'Status']],
      body: tableBody,
      foot: tableFoot,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      footStyles: {
        fillColor: [241, 245, 249], // slate-100
        textColor: [15, 23, 42],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 24 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
        7: { halign: 'center', cellWidth: 18 },
      },
      didParseCell: (data) => {
        // Estilizar coluna de Resultado Líquido
        if (data.section === 'body' && data.column.index === 6) {
          const rawText = String(data.cell.raw);
          if (rawText.startsWith('-')) {
            data.cell.styles.textColor = [190, 18, 60]; // rose
          } else {
            data.cell.styles.textColor = [4, 120, 87]; // emerald
          }
        }
        // Estilizar status
        if (data.section === 'body' && data.column.index === 7) {
          if (data.cell.raw === 'Fechado') {
            data.cell.styles.textColor = [4, 120, 87];
          } else {
            data.cell.styles.textColor = [180, 83, 9];
          }
        }
      },
      margin: { left: margin, right: margin },
    });
  }

  // Obter posição Y final após a tabela
  // @ts-expect-error jspdf-autotable injection
  const finalY = doc.lastAutoTable?.finalY || currentY + 40;

  // ─── 6. ASSINATURAS E VALIDAÇÃO (SE HOUVER ESPAÇO NA PÁGINA) ───
  let signY = finalY + 12;
  if (signY + 25 > pageHeight - margin) {
    doc.addPage();
    signY = margin + 15;
  }

  const signColWidth = (pageWidth - margin * 2 - 20) / 2;

  // Linha de assinatura do Operador/Responsável
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.line(margin + 5, signY, margin + 5 + signColWidth, signY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Responsável pelo Fecho / Caixa', margin + 5 + signColWidth / 2, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(userName, margin + 5 + signColWidth / 2, signY + 8, { align: 'center' });

  // Linha de assinatura da Gerência/Supervisão
  doc.line(pageWidth - margin - 5 - signColWidth, signY, pageWidth - margin - 5, signY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Supervisão / Gerência Administrativa', pageWidth - margin - 5 - signColWidth / 2, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Rápido e Seguro — Controlo e Tesouraria', pageWidth - margin - 5 - signColWidth / 2, signY + 8, { align: 'center' });

  // ─── 7. RODAPÉ DE PÁGINA ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Rápido e Seguro — Relatório Mensal Oficial Gerado Automaticamente', margin, pageHeight - 6);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
}

/**
 * Faz o download direto do PDF do relatório mensal no navegador
 */
export async function downloadMonthlyReportPdf({
  month,
  userName = 'Utilizador',
  postoName = 'Todos os Postos',
  postoId,
}: {
  month: MonthlyReport;
  userName?: string;
  postoName?: string;
  postoId?: string;
}): Promise<void> {
  // Buscar relatórios diários do mês para compor a tabela completa
  const [year, mStr] = month.yearMonth.split('-');
  const daysInMonth = new Date(parseInt(year, 10), parseInt(mStr, 10), 0).getDate();
  const startDate = `${month.yearMonth}-01`;
  const endDate = `${month.yearMonth}-${String(daysInMonth).padStart(2, '0')}`;

  let reports: DailyReport[] = [];
  try {
    const query = new URLSearchParams({ startDate, endDate });
    if (postoId && postoId !== 'all') {
      query.set('postoId', postoId);
    }
    const res = await fetch(`/api/reports?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      reports = data.reports || [];
    }
  } catch (err) {
    console.error('Aviso: Não foi possível obter detalhes diários para o PDF:', err);
  }

  const doc = createMonthlyReportPdfDoc({
    month,
    reports,
    userName,
    postoName,
  });

  const filename = `Relatorio_Mensal_${month.yearMonth}_Rapido_e_Seguro.pdf`;
  doc.save(filename);
}

/**
 * Abre o PDF numa nova janela/aba para visualização e impressão
 */
export async function openMonthlyReportPdfPrint({
  month,
  userName = 'Utilizador',
  postoName = 'Todos os Postos',
  postoId,
}: {
  month: MonthlyReport;
  userName?: string;
  postoName?: string;
  postoId?: string;
}): Promise<void> {
  const [year, mStr] = month.yearMonth.split('-');
  const daysInMonth = new Date(parseInt(year, 10), parseInt(mStr, 10), 0).getDate();
  const startDate = `${month.yearMonth}-01`;
  const endDate = `${month.yearMonth}-${String(daysInMonth).padStart(2, '0')}`;

  let reports: DailyReport[] = [];
  try {
    const query = new URLSearchParams({ startDate, endDate });
    if (postoId && postoId !== 'all') {
      query.set('postoId', postoId);
    }
    const res = await fetch(`/api/reports?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      reports = data.reports || [];
    }
  } catch (err) {
    console.error('Aviso ao obter relatórios diários para impressão:', err);
  }

  const doc = createMonthlyReportPdfDoc({
    month,
    reports,
    userName,
    postoName,
  });

  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, '_blank');
}

/**
 * Cria o PDF de um relatório diário individual oficial
 */
export function createDailyReportPdfDoc(report: DailyReport, userName = 'Utilizador'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Faixa superior verde esmeralda
  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('RÁPIDO E SEGURO', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text('Relatório Oficial de Caixa e Movimentação Diária', margin, 18);

  // Data do Fecho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(formatDatePt(report.data).toUpperCase(), pageWidth - margin, 12, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text(`Status: ${report.status === 'fechado' ? 'FECHADO' : 'RASCUNHO'}`, pageWidth - margin, 18, { align: 'right' });

  currentY = 34;

  // Metadados do dia
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 13, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Posto de Venda:', margin + 4, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(report.posto?.nome || 'Posto Principal', margin + 30, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Operador do Caixa:', margin + 4, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(report.user?.nome || userName, margin + 32, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Emitido em:', pageWidth - margin - 55, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const now = new Date();
  doc.text(`${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`, pageWidth - margin - 35, currentY + 5.5);

  currentY += 17;

  // Bloco de Resultado Líquido
  const isPositive = (report.total_final || 0) >= 0;
  const resBg = isPositive ? [236, 253, 245] : [255, 241, 242];
  const resBorder = isPositive ? [16, 185, 129] : [244, 63, 94];
  const resText = isPositive ? [6, 95, 70] : [159, 18, 57];

  doc.setFillColor(resBg[0], resBg[1], resBg[2]);
  doc.setDrawColor(resBorder[0], resBorder[1], resBorder[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 16, 2, 2, 'FD');
  doc.setLineWidth(0.2);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(resText[0], resText[1], resText[2]);
  doc.text('RESULTADO LÍQUIDO DO DIA (Vendas + Todas as Taxas + Bónus AKI - Saídas)', margin + 4, currentY + 5.5);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${isPositive ? '+' : ''}${formatKz(report.total_final || 0)}`,
    margin + 4,
    currentY + 12.5
  );

  currentY += 20;

  // Tabela de Vendas por Canal
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. VENDAS E TAXAS POR CANAL', margin, currentY);

  currentY += 2;

  const channelsData = (report.sales_entries || []).map((c) => [
    c.canal.toUpperCase(),
    formatKz(c.valor_vendido || 0),
    formatKz(c.taxa || 0),
    formatKz((c.valor_vendido || 0) + (c.taxa || 0)),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Canal de Venda', 'Valor Vendido (Kz)', 'Taxa Acrescentada (Kz)', 'Subtotal Arrecadado (Kz)']],
    body: channelsData.length > 0 ? channelsData : [['Nenhum canal registado', '0,00 Kz', '0,00 Kz', '0,00 Kz']],
    foot: [[
      'SUBTOTAL GERAL',
      formatKz(report.total_vendas_brutas || 0),
      formatKz(report.total_taxas_acrescentadas || 0),
      formatKz((report.total_vendas_brutas || 0) + (report.total_taxas_acrescentadas || 0)),
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error jspdf-autotable injection
  currentY = (doc.lastAutoTable?.finalY || currentY + 30) + 5;

  // Bónus AKI (se houver)
  if ((report.aki_bonus?.valor || 0) > 0) {
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(253, 224, 71);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 8, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(161, 98, 7);
    doc.text('BÓNUS EXTRA AKI:', margin + 4, currentY + 5);
    doc.text(`+${formatKz(report.aki_bonus?.valor || 0)}`, pageWidth - margin - 4, currentY + 5, { align: 'right' });

    currentY += 12;
  }

  // Tabela de Saídas / Despesas
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. SAÍDAS E DESPESAS DO DIA', margin, currentY);

  currentY += 2;

  const expensesData = (report.expenses || []).map((e) => [
    e.categoria.toUpperCase(),
    e.descricao || 'Despesa operacional',
    formatKz(e.valor || 0),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Categoria', 'Descrição da Saída', 'Valor (Kz)']],
    body: expensesData.length > 0 ? expensesData : [['Sem saídas registadas', '—', '0,00 Kz']],
    foot: [[
      'TOTAL DE SAÍDAS',
      '—',
      formatKz(report.total_saidas || 0),
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [255, 241, 242],
      textColor: [190, 18, 60],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 35 },
      2: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error jspdf-autotable injection
  currentY = (doc.lastAutoTable?.finalY || currentY + 30) + 12;

  // Observações (se houver)
  if (report.observacoes) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Observações:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(report.observacoes, margin, currentY + 4, { maxWidth: pageWidth - margin * 2 });
    currentY += 10;
  }

  // Assinaturas
  if (currentY + 20 > pageHeight - margin) {
    doc.addPage();
    currentY = margin + 15;
  }

  const signWidth = (pageWidth - margin * 2 - 20) / 2;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 5, currentY + 12, margin + 5 + signWidth, currentY + 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Operador de Caixa', margin + 5 + signWidth / 2, currentY + 16, { align: 'center' });

  doc.line(pageWidth - margin - 5 - signWidth, currentY + 12, pageWidth - margin - 5, currentY + 12);
  doc.text('Gerência / Validação', pageWidth - margin - 5 - signWidth / 2, currentY + 16, { align: 'center' });

  // Rodapé
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Rápido e Seguro — Sistema de Gestão Financeira', margin, pageHeight - 6);

  return doc;
}

/**
 * Baixa o PDF do relatório diário diretamente no navegador
 */
export function downloadDailyReportPdf(report: DailyReport, userName = 'Utilizador'): void {
  const doc = createDailyReportPdfDoc(report, userName);
  const filename = `Relatorio_Diario_${report.data}_Rapido_e_Seguro.pdf`;
  doc.save(filename);
}

