// src/lib/exportErrorReportPdf.ts
//
// Gera um PDF com todas as linhas que contêm erro (e aviso), agrupadas pelo
// mesmo critério usado no ErrorDashboard, cada grupo com sua tabela de
// linhas/colunas/valores e um texto de "como corrigir".
//
// O texto de "como corrigir" replica a mesma lógica de negócio usada em
// ClientMessageModal.tsx (buildMessage), mas em texto simples — sem
// asteriscos de WhatsApp e sem emojis, já que a fonte padrão do jsPDF
// (Helvetica) não renderiza emoji corretamente.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ValidationResult } from '@/lib/validateFile';
import {
  NUMBER_AS_TEXT_PREFIX,
  LEADING_ZERO_LABEL,
  DATE_AS_SERIAL_LABEL,
  DATE_WRONG_FORMAT_LABEL,
  INSTRUCTION_ROW_LABEL,
  GHOST_ROWS_LABEL_PREFIX,
  REQUIRED_VALUE_LABEL,
  INVALID_CHAR_LABEL,
  INVISIBLE_CHAR_LABEL,
  SUPPLIER_TYPE_LABEL,
} from '@/lib/validateFile';
import type { CellRule } from '@/lib/validationRules';
import { groupCellErrors } from '@/components/ErrorDashboard';

const MARGIN = 40;

// ─── Textos de "como corrigir" (mesma lógica do ClientMessageModal) ───────────

function finalFormatLabel(rule: CellRule): string {
  switch (rule) {
    case 'currency':     return 'Moeda (decimais com vírgula, sem R$)';
    case 'currency_dot': return 'Moeda (decimais com ponto, sem R$)';
    case 'juros':        return 'Geral';
    case 'stock':        return 'Número (inteiro, pode ser negativo)';
    case 'numbers':
    case 'binary':
    default:             return 'Geral';
  }
}

function finalFormatPath(rule: CellRule): string {
  switch (rule) {
    case 'currency':
    case 'currency_dot': return 'Página Inicial → Número → Moeda';
    default:             return 'Página Inicial → Número → Geral';
  }
}

function getFixInstructions(ruleLabel: string, rule: CellRule): string {
  if (ruleLabel.startsWith(NUMBER_AS_TEXT_PREFIX)) {
    const fmt  = finalFormatLabel(rule);
    const path = finalFormatPath(rule);
    return `Número armazenado como texto. 1) Selecione a coluna. 2) Clique no aviso à esquerda e escolha "Converter para Número". 3) Vá em ${path} e aplique "${fmt}".`;
  }
  if (ruleLabel === LEADING_ZERO_LABEL) {
    return 'Risco de perder zeros à esquerda. 1) Selecione a coluna. 2) Página Inicial → Número → Texto. 3) Redigite os valores com os zeros (ex: CPF 04652781407).';
  }
  if (ruleLabel === DATE_AS_SERIAL_LABEL || ruleLabel === DATE_WRONG_FORMAT_LABEL) {
    return 'Data em formato errado. Precisa estar como AAAA-MM-DD (ex: 2024-12-31). 1) Selecione a coluna. 2) Página Inicial → Mais Formatos de Número → Data. 3) Localidade: Inglês (Estados Unidos) → formato YYYY-MM-DD.';
  }
  if (rule === 'juros') {
    return 'Juros/Multa em formato errado. Máximo 3 dígitos inteiros + 2 decimais com vírgula (ex: 10,50), célula no formato Geral.';
  }
  if (rule === 'currency_dot') {
    return 'Valor em formato errado. Use ponto como decimal (ex: 1250.99), sem "R$". Formato: Página Inicial → Número → Moeda.';
  }
  if (rule === 'currency') {
    return 'Valor em formato errado. Use vírgula como decimal (ex: 1250,99), sem "R$". Formato: Página Inicial → Número → Moeda.';
  }
  if (ruleLabel === INVALID_CHAR_LABEL || ruleLabel === INVISIBLE_CHAR_LABEL) {
    return 'Caractere inválido/invisível. 1) Clique na célula indicada. 2) Selecione tudo (Ctrl+A) e redigite o valor manualmente.';
  }
  if (ruleLabel === REQUIRED_VALUE_LABEL) {
    return 'Campo obrigatório vazio. Preencha todas as linhas dessa coluna.';
  }
  if (ruleLabel === SUPPLIER_TYPE_LABEL) {
    return 'Tipo de fornecedor obrigatório. Preencha os três: Forn. Produto, Forn. Serviço e Forn. Transporte (0 ou 1).';
  }
  if (ruleLabel.toLowerCase().includes('morada')) {
    return 'Endereço incompleto. Preencha todos os campos de endereço (CEP, Logradouro, Número, Complemento, Bairro, Referência, Cidade, Estado) ou deixe todos em branco.';
  }
  if (ruleLabel.startsWith('Texto excede o limite de')) {
    return `${ruleLabel}.`;
  }
  const fmt = finalFormatLabel(rule);
  return `Valor inválido. Aplique o formato: ${finalFormatPath(rule)} → ${fmt}.`;
}

// ─── Helpers de layout ─────────────────────────────────────────────────────────

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function lastAutoTableY(doc: jsPDF): number {
  // jspdf-autotable anexa `lastAutoTable` na instância em runtime; não faz
  // parte dos tipos oficiais do jsPDF.
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function addGroupSection(
  doc: jsPDF,
  y: number,
  pageWidth: number,
  opts: { title: string; fix: string; rows: string[][]; multiColumn: boolean },
): number {
  y = ensureSpace(doc, y, 70);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const titleLines = doc.splitTextToSize(opts.title, pageWidth - MARGIN * 2);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 12 + 2;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  const fixLines = doc.splitTextToSize(`Como corrigir: ${opts.fix}`, pageWidth - MARGIN * 2);
  doc.text(fixLines, MARGIN, y);
  y += fixLines.length * 11 + 6;

  const head = opts.multiColumn
    ? [['Linha', 'Coluna', 'Valor encontrado']]
    : [['Linha', 'Valor encontrado']];
  const body = opts.multiColumn ? opts.rows : opts.rows.map(r => [r[0], r[2]]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [230, 160, 40], textColor: [40, 30, 10] },
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: opts.multiColumn
      ? { 0: { cellWidth: 40 }, 1: { cellWidth: 100 } }
      : { 0: { cellWidth: 40 } },
  });

  return lastAutoTableY(doc) + 18;
}

// ─── Função principal ──────────────────────────────────────────────────────────

export function exportErrorReportPdf(result: ValidationResult, fileName: string, fileTypeLabel: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = MARGIN;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Relatório de Validação', MARGIN, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Ficheiro: ${fileName}`, MARGIN, y); y += 14;
  doc.text(`Tipo: ${fileTypeLabel}`, MARGIN, y); y += 14;
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, MARGIN, y); y += 18;

  // Mesmos filtros/agrupamentos usados no ErrorDashboard, para o relatório
  // bater exatamente com o que aparece na tela.
  const relevantCellErrors = result.cellErrors.filter(
    e => e.ruleLabel !== INSTRUCTION_ROW_LABEL
      && !e.ruleLabel.startsWith(GHOST_ROWS_LABEL_PREFIX)
      && !e.column.includes('morada'),
  );
  const blockingCellErrors = relevantCellErrors.filter(e => e.severity !== 'warning');
  const warningCellErrors  = relevantCellErrors.filter(e => e.severity === 'warning');
  const totalBlockingCellErrors = blockingCellErrors.reduce((sum, e) => sum + e.failCount, 0);
  const totalWarnings           = warningCellErrors.reduce((sum, e) => sum + e.failCount, 0);
  const moradaErrors  = result.cellErrors.filter(e => e.column.includes('morada'));
  const instrError    = result.cellErrors.find(e => e.ruleLabel === INSTRUCTION_ROW_LABEL);
  const ghostRowError = result.cellErrors.find(e => e.ruleLabel.startsWith(GHOST_ROWS_LABEL_PREFIX));

  // ── Resumo ──────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Linhas analisadas', 'Colunas em falta', 'Total de erros', 'Avisos', 'Linhas fantasma']],
    body: [[
      String(result.rowCount),
      String(result.columnErrors.length),
      String(result.columnErrors.length + totalBlockingCellErrors),
      String(totalWarnings),
      String(result.ghostRowCount),
    ]],
    theme: 'grid',
    headStyles: { fillColor: [58, 40, 97] },
    styles: { fontSize: 9, halign: 'center' },
  });
  y = lastAutoTableY(doc) + 20;

  // ── Linha de instruções ──────────────────────────────────────────────────────
  if (instrError) {
    y = ensureSpace(doc, y, 50);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Linha de instruções detectada', MARGIN, y); y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const txt = doc.splitTextToSize(
      'A linha 2 parece conter textos de orientação de preenchimento, não dados reais. Apague essa linha inteira antes de importar.',
      pageWidth - MARGIN * 2,
    );
    doc.text(txt, MARGIN, y); y += txt.length * 12 + 10;
  }

  // ── Linhas fantasma ───────────────────────────────────────────────────────────
  if (ghostRowError) {
    y = ensureSpace(doc, y, 50);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(`${result.ghostRowCount} linha${result.ghostRowCount > 1 ? 's' : ''} fantasma detectada${result.ghostRowCount > 1 ? 's' : ''} — bloqueia a importação`, MARGIN, y); y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const txt = doc.splitTextToSize(
      'O Excel registra a planilha como tendo mais linhas do que dados reais (geralmente por formatação aplicada numa faixa vazia). ' +
      'Selecione as linhas abaixo da última com dado real, botão direito > "Excluir linhas" (não "Limpar conteúdo"), e salve.',
      pageWidth - MARGIN * 2,
    );
    doc.text(txt, MARGIN, y); y += txt.length * 12 + 10;
  }

  // ── Colunas em falta ─────────────────────────────────────────────────────────
  if (result.columnErrors.length > 0) {
    y = ensureSpace(doc, y, 60);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(`Colunas em falta (${result.columnErrors.length})`, MARGIN, y); y += 8;
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Coluna obrigatória ausente']],
      body: result.columnErrors.map(e => [e.column]),
      theme: 'striped',
      headStyles: { fillColor: [180, 50, 50] },
      styles: { fontSize: 9 },
    });
    y = lastAutoTableY(doc) + 16;
  }

  // ── Endereço incompleto ──────────────────────────────────────────────────────
  if (moradaErrors.length > 0) {
    const rows = moradaErrors.flatMap(e =>
      e.details.map(d => [
        String(d.row),
        d.colName ?? e.column.replace(' (morada incompleta)', ''),
        d.value,
      ]),
    );
    y = addGroupSection(doc, y, pageWidth, {
      title: 'Endereço incompleto',
      fix: getFixInstructions(moradaErrors[0].ruleLabel, moradaErrors[0].rule),
      rows,
      multiColumn: true,
    });
  }

  // ── Erros nas células ────────────────────────────────────────────────────────
  const groupedErrors = groupCellErrors(blockingCellErrors);
  if (groupedErrors.length > 0) {
    y = ensureSpace(doc, y, 40);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text(`Erros nas células (${totalBlockingCellErrors})`, MARGIN, y); y += 18;

    for (const g of groupedErrors) {
      y = addGroupSection(doc, y, pageWidth, {
        title: g.columns.length > 1 ? `${g.columns.length} colunas: ${g.columns.join(', ')}` : g.columns[0],
        fix: getFixInstructions(g.ruleLabel, g.rule),
        rows: g.details.map(d => [String(d.row), d.colName ?? '', d.value]),
        multiColumn: g.columns.length > 1,
      });
    }
  }

  // ── Avisos ───────────────────────────────────────────────────────────────────
  const groupedWarnings = groupCellErrors(warningCellErrors);
  if (groupedWarnings.length > 0) {
    y = ensureSpace(doc, y, 40);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text(`Avisos (${totalWarnings})`, MARGIN, y); y += 18;

    for (const g of groupedWarnings) {
      y = addGroupSection(doc, y, pageWidth, {
        title: g.columns.length > 1 ? `${g.columns.length} colunas: ${g.columns.join(', ')}` : g.columns[0],
        fix: getFixInstructions(g.ruleLabel, g.rule),
        rows: g.details.map(d => [String(d.row), d.colName ?? '', d.value]),
        multiColumn: g.columns.length > 1,
      });
    }
  }

  const safeName = fileName.replace(/\.[^.]+$/, '');
  doc.save(`relatorio-erros-${safeName}.pdf`);
}
