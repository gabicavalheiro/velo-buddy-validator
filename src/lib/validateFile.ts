import * as XLSX from 'xlsx';
import { FileTypeConfig, VALIDATORS, CellRule } from './validationRules';

export interface ColumnError {
  column: string;
}

export interface CellErrorDetail {
  row: number;
  value: string;
}

export interface CellError {
  column: string;
  rule: CellRule;
  ruleLabel: string;
  failCount: number;
  totalCount: number;
  details: CellErrorDetail[];
}

export interface ValidationResult {
  success: boolean;
  columnErrors: ColumnError[];
  cellErrors: CellError[];
  rowCount: number;
}

export const NUMBER_AS_TEXT_LABEL =
  'Número armazenado como texto — altere a formatação da célula para "Número" ou "Geral"';

// Prefixo comum a todos os labels de número-como-texto (para detecção em componentes)
export const NUMBER_AS_TEXT_PREFIX = 'Número armazenado como texto';


export const DATE_AS_SERIAL_LABEL =
  'Data em formato incorreto — formate a coluna como Data no padrão AAAA-MM-DD (ex: 2024-12-31)';

export const REQUIRED_VALUE_LABEL = 'Campo obrigatório — esta coluna não pode ter linhas em branco';

export const INSTRUCTION_ROW_LABEL = 'A linha 2 parece conter instruções de preenchimento e não dados reais — apague essa linha antes de importar';

export const JUROS_RULE_LABEL =
  'Juros/Multa — até 3 dígitos inteiros e 2 decimais com vírgula (ex: 10,50). Formato: Geral';

export const LEADING_ZERO_LABEL =
  'Esta coluna deve estar formatada como "Texto" no Excel — valores numéricos perdem os zeros à esquerda (ex: CPF "04652781407" vira "4652781407")';

export const DATE_WRONG_FORMAT_LABEL =
  'Data em formato incorreto — formate a coluna como Data no padrão AAAA-MM-DD (ex: 2024-12-31)';

export function parseFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Converte número serial do Excel para string "YYYY-MM-DD"
 * (usado apenas para exibir o valor no relatório de erros, não para validar).
 */
function excelSerialToDateString(serial: number): string {
  const date = XLSX.SSF.parse_date_code(serial);
  if (!date) return String(serial);
  return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
}

/**
 * Normaliza string para comparação:
 * - trim + colapsa espaços internos múltiplos
 * - lowercase
 * - remove acentos (NFD → strip diacríticos)
 * - remove caracteres invisíveis (zero-width spaces, BOM, etc.)
 */
function normalizeForMatch(s: string): string {
  return s
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '') // invisíveis
    .trim()
    .replace(/\s+/g, ' ')                          // espaços internos múltiplos → 1
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');              // remove diacríticos
}

/**
 * Resolve nome canônico → índice no cabeçalho real.
 * Tenta em ordem:
 *   1. Exact match (sem normalização)
 *   2. Normalização completa (trim + lowercase + sem acento + espaços colapsados)
 *   3. Aliases com a mesma normalização
 */
function resolveColumnIndices(
  headerRow: string[],
  config: FileTypeConfig,
): Map<string, number> {
  const aliases = config.columnAliases ?? {};
  const result = new Map<string, number>();

  // Pré-computa versão normalizada de cada cabeçalho para evitar recalcular
  const normalizedHeader = headerRow.map(normalizeForMatch);

  const canonicalNames = new Set([
    ...config.requiredColumns,
    ...Object.keys(config.cellRules),
    ...(config.addressColumns ?? []),
    ...(config.requiredValueColumns ?? []),
  ]);

  for (const canonical of canonicalNames) {
    // 1. Exact match
    let idx = headerRow.indexOf(canonical);

    // 2. Normalized match
    if (idx === -1) {
      const normCanonical = normalizeForMatch(canonical);
      idx = normalizedHeader.findIndex((h) => h === normCanonical);
    }

    // 3. Aliases (normalized)
    if (idx === -1 && aliases[canonical]) {
      for (const alias of aliases[canonical]) {
        const normAlias = normalizeForMatch(alias);
        idx = normalizedHeader.findIndex((h) => h === normAlias);
        if (idx !== -1) break;
      }
    }

    if (idx !== -1) result.set(canonical, idx);
  }

  return result;
}


/**
 * Retorna o label de "número como texto" específico para cada tipo de coluna,
 * indicando o formato final correto que o utilizador deve aplicar após converter.
 */
function numberAsTextLabel(rule: CellRule): string {
  switch (rule) {
    case 'currency':
      return 'Número armazenado como texto — converta para Número e aplique o formato "Moeda"';
    case 'stock':
      return 'Número armazenado como texto — converta para Número e aplique o formato "Número" (inteiros, pode ser negativo)';
    case 'juros':
      return 'Número armazenado como texto — converta para Número e aplique o formato "Geral" (ex: 10,50)';
    case 'binary':
      return 'Número armazenado como texto — converta para Número e aplique o formato "Geral" (apenas 0 ou 1)';
    case 'numbers':
    default:
      return 'Número armazenado como texto — converta para Número e aplique o formato "Geral"';
  }
}

export function validateWorkbook(workbook: XLSX.WorkBook, config: FileTypeConfig): ValidationResult {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const dataRows = allRows.slice(config.skipRows);
  if (dataRows.length === 0) {
    return {
      success: false,
      columnErrors: [{ column: '(Ficheiro vazio após ignorar linhas de cabeçalho)' }],
      cellErrors: [],
      rowCount: 0,
    };
  }

  const headerRow = (dataRows[0] as unknown[]).map((h) => String(h).trim());

  // Remove linhas vazias do final — o Excel inclui linhas fantasma no usedRange
  // mesmo depois dos dados acabarem. Valida apenas até a última linha com conteúdo.
  const rawRows = dataRows.slice(1) as unknown[][];
  let lastFilledIdx = rawRows.length - 1;
  while (lastFilledIdx >= 0) {
    const hasContent = (rawRows[lastFilledIdx] as unknown[]).some(
      (v) => String(v ?? '').trim() !== '',
    );
    if (hasContent) break;
    lastFilledIdx--;
  }
  const rows = rawRows.slice(0, lastFilledIdx + 1);

  const colIndexMap = resolveColumnIndices(headerRow, config);

  // Detecção de linha de instruções (linha 2 com texto descritivo longo)
  // Sinal: a maioria das células da primeira linha de dados contém texto longo (>40 chars)
  // ou palavras-chave típicas de instruções
  const instructionKeywords = [
    'obrigatório', 'obrigatorio', 'use a formatação', 'use a formatacao',
    'campo de texto', 'informe', 'utilize o padrão', 'utilize o padrao',
    'caracteres', 'separe as casas', 'recomenda-se',
  ];
  if (rows.length > 0) {
    const firstDataRow = rows[0];
    const nonEmptyCells = firstDataRow.map((v) => String(v ?? '').trim()).filter((v) => v !== '');
    if (nonEmptyCells.length > 0) {
      const longTextCount = nonEmptyCells.filter((v) => v.length > 40).length;
      const keywordCount = nonEmptyCells.filter((v) =>
        instructionKeywords.some((kw) => v.toLowerCase().includes(kw))
      ).length;
      if (longTextCount >= 2 || keywordCount >= 1) {
        return {
          success: false,
          columnErrors: [],
          cellErrors: [{
            column: 'Linha 2',
            rule: 'numbers' as CellRule,
            ruleLabel: INSTRUCTION_ROW_LABEL,
            failCount: 1,
            totalCount: 1,
            details: [{ row: 2, value: nonEmptyCells[0].slice(0, 80) + (nonEmptyCells[0].length > 80 ? '…' : '') }],
          }],
          rowCount: rows.length - 1,
        };
      }
    }
  }

  // Colunas obrigatórias
  const columnErrors: ColumnError[] = [];
  for (const col of config.requiredColumns) {
    if (!colIndexMap.has(col)) columnErrors.push({ column: col });
  }

  // Validação de células
  const cellErrors: CellError[] = [];

  // Resolve índice da coluna de unidade (para validação cruzada de estoque com KG)
  const leadingZeroCols = new Set(config.leadingZeroColumns ?? []);
  const unitColIdx = config.unitColumn ? colIndexMap.get(config.unitColumn) : undefined;
  const KG_ALIASES = new Set(['kg', 'kilo', 'quilograma', 'quilogramas', 'kilograma', 'kilogramas']);

  for (const [colName, rule] of Object.entries(config.cellRules)) {
    const colIdx = colIndexMap.get(colName);
    if (colIdx === undefined) continue;

    const validator = VALIDATORS[rule];
    let failCount = 0, totalCount = 0;
    const details: CellErrorDetail[] = [];

    let textFailCount = 0;
    const textDetails: CellErrorDetail[] = [];
    let leadingZeroFailCount = 0;
    const leadingZeroDetails: CellErrorDetail[] = [];

    // Datas armazenadas como serial do Excel (typeof number na coluna date)
    let dateSerialCount = 0;
    const dateSerialDetails: CellErrorDetail[] = [];

    let dateWrongFormatCount = 0;
    const dateWrongFormatDetails: CellErrorDetail[] = [];

    // Calculado uma vez por coluna — não muda entre linhas
    const isLeadingZero = leadingZeroCols.has(colName);

    for (let i = 0; i < rows.length; i++) {
      const rawVal = rows[i][colIdx];
      const cellVal = String(rawVal ?? '').trim();

      if (cellVal === '') continue;
      totalCount++;

      // Data armazenada como número serial do Excel
      if (rule === 'date' && typeof rawVal === 'number') {
        dateSerialCount++;
        dateSerialDetails.push({
          row: i + 2 + config.skipRows,
          value: excelSerialToDateString(rawVal as number),
        });
        continue;
      }

      // ─── LEADING ZERO: coluna deve estar como Texto ────────────────────────────
      // Se isLeadingZero e rawVal é number → zeros perdidos → erro de formatação
      // Se isLeadingZero e rawVal é string → correto, valida conteúdo normalmente
      if (isLeadingZero) {
        if (typeof rawVal === 'number') {
          // Número → zeros à esquerda perdidos
          leadingZeroFailCount++;
          leadingZeroDetails.push({ row: i + 2 + config.skipRows, value: cellVal });
        }
        // String (Texto) → formato correto, não gera nenhum outro erro
        // Não validamos conteúdo aqui: CPF/CNPJ/IE podem ter pontos e traços
        continue;
      }

      // ─── NÚMERO ARMAZENADO COMO TEXTO ───────────────────────────────────────────
      if (typeof rawVal === 'string' && rule !== 'date') {
        textFailCount++;
        textDetails.push({ row: i + 2 + config.skipRows, value: cellVal });
        continue;
      }

      // ─── VALIDAÇÃO CRUZADA: stock + UNIDADE = KG → aceita decimal ───────────────
      if (rule === 'stock') {
        const unitVal = unitColIdx !== undefined
          ? String(rows[i][unitColIdx] ?? '').trim().toLowerCase()
          : '';
        const isKg = KG_ALIASES.has(unitVal);
        const num = Number(cellVal);
        if (!Number.isFinite(num)) {
          failCount++;
          details.push({ row: i + 2 + config.skipRows, value: cellVal });
        } else if (!isKg && !Number.isInteger(num)) {
          // Não é KG e tem decimal → erro
          failCount++;
          details.push({ row: i + 2 + config.skipRows, value: cellVal });
        }
        // isKg + decimal → OK; qualquer inteiro (positivo/negativo) → OK
        continue;
      }

      if (!validator.test(cellVal)) {
        if (rule === 'date') {
          dateWrongFormatCount++;
          dateWrongFormatDetails.push({ row: i + 2 + config.skipRows, value: cellVal });
        } else {
          failCount++;
          details.push({ row: i + 2 + config.skipRows, value: cellVal });
        }
      }
    }

    if (failCount > 0)
      cellErrors.push({ column: colName, rule, ruleLabel: validator.label, failCount, totalCount, details });

    if (textFailCount > 0)
      cellErrors.push({ column: colName, rule, ruleLabel: numberAsTextLabel(rule), failCount: textFailCount, totalCount, details: textDetails });

    if (leadingZeroFailCount > 0)
      cellErrors.push({ column: colName, rule, ruleLabel: LEADING_ZERO_LABEL, failCount: leadingZeroFailCount, totalCount, details: leadingZeroDetails });


    // Data como serial — rejeitada: precisa estar como texto AAAA-MM-DD
    if (dateSerialCount > 0)
      cellErrors.push({ column: colName, rule, ruleLabel: DATE_AS_SERIAL_LABEL, failCount: dateSerialCount, totalCount, details: dateSerialDetails });

    // Data como texto mas formato errado (ex: 31/12/2020)
    if (dateWrongFormatCount > 0)
      cellErrors.push({ column: colName, rule, ruleLabel: DATE_WRONG_FORMAT_LABEL, failCount: dateWrongFormatCount, totalCount, details: dateWrongFormatDetails });
  }


  // ─── VARREDURA UNIVERSAL: número armazenado como texto ──────────────────────
  // Itera TODAS as colunas da planilha, incluindo as que não estão em cellRules
  // ou cujo nome não foi resolvido pelo alias. Se qualquer célula não-data for
  // typeof 'string' E parecer número (dígitos, vírgula/ponto decimal), é erro.
  // Colunas já analisadas em cellRules são ignoradas para não duplicar erros.
  {
    // Skip cellRules columns AND leadingZero columns (they have their own logic above)
    const alreadyChecked = new Set([
      ...Object.keys(config.cellRules)
        .map((name) => colIndexMap.get(name))
        .filter((idx): idx is number => idx !== undefined),
      ...(config.leadingZeroColumns ?? [])
        .map((name) => colIndexMap.get(name))
        .filter((idx): idx is number => idx !== undefined),
    ]);

    const looksNumeric = (v: string) =>
      /^-?\d+([.,]\d+)?$/.test(v.trim());

    for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
      if (alreadyChecked.has(colIdx)) continue;

      const colLabel = headerRow[colIdx] || `Coluna ${colIdx + 1}`;
      const textDetails: CellErrorDetail[] = [];

      for (let i = 0; i < rows.length; i++) {
        const rawVal = rows[i][colIdx];
        if (rawVal === '' || rawVal === null || rawVal === undefined) continue;
        if (typeof rawVal === 'string' && looksNumeric(rawVal)) {
          textDetails.push({ row: i + 2 + config.skipRows, value: rawVal.trim() });
        }
      }

      if (textDetails.length > 0) {
        cellErrors.push({
          column: colLabel,
          rule: 'numbers',
          ruleLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Geral"',
          failCount: textDetails.length,
          totalCount: rows.length,
          details: textDetails,
        });
      }
    }
  }

  // Colunas com valor obrigatório por linha
  if (config.requiredValueColumns) {
    for (const colName of config.requiredValueColumns) {
      const colIdx = colIndexMap.get(colName);
      if (colIdx === undefined) continue; // já reportado em columnErrors

      let emptyCount = 0;
      const emptyDetails: CellErrorDetail[] = [];

      for (let i = 0; i < rows.length; i++) {
        const val = String(rows[i][colIdx] ?? '').trim();
        if (val === '') {
          emptyCount++;
          emptyDetails.push({ row: i + 2 + config.skipRows, value: '(vazio)' });
        }
      }

      if (emptyCount > 0) {
        cellErrors.push({
          column: colName,
          rule: 'numbers',
          ruleLabel: REQUIRED_VALUE_LABEL,
          failCount: emptyCount,
          totalCount: rows.length,
          details: emptyDetails,
        });
      }
    }
  }

  // Validação condicional de morada
  if (config.addressColumns) {
    const addrIndices = config.addressColumns.map((c) => ({ name: c, idx: colIndexMap.get(c) ?? -1 }));
    const existingAddr = addrIndices.filter((a) => a.idx !== -1);

    if (existingAddr.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const hasAnyAddr = existingAddr.some((a) => String(row[a.idx] ?? '').trim() !== '');
        if (hasAnyAddr) {
          for (const addr of existingAddr) {
            const val = String(row[addr.idx] ?? '').trim();
            if (val === '') {
              const errorKey = `${addr.name} (morada incompleta)`;
              let existing = cellErrors.find((e) => e.column === errorKey);
              if (!existing) {
                existing = { column: errorKey, rule: 'numbers', ruleLabel: 'Morada obrigatória quando parcialmente preenchida', failCount: 0, totalCount: rows.length, details: [] };
                cellErrors.push(existing);
              }
              existing.failCount++;
              existing.details.push({ row: i + 2 + config.skipRows, value: '(vazio)' });
            }
          }
        }
      }
    }
  }

  return {
    success: columnErrors.length === 0 && cellErrors.length === 0,
    columnErrors,
    cellErrors,
    rowCount: rows.length,
  };
}