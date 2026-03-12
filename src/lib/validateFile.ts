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
 * Converte número serial do Excel (ex: 46091) para string "YYYY-MM-DD".
 */
function excelSerialToDateString(serial: number): string {
  const date = XLSX.SSF.parse_date_code(serial);
  if (!date) return String(serial);
  const yyyy = date.y;
  const mm = String(date.m).padStart(2, '0');
  const dd = String(date.d).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Resolve nome canônico → índice no cabeçalho real.
 * Tenta: exact match → case-insensitive → aliases.
 */
function resolveColumnIndices(
  headerRow: string[],
  config: FileTypeConfig,
): Map<string, number> {
  const aliases = config.columnAliases ?? {};
  const result = new Map<string, number>();

  const canonicalNames = new Set([
    ...config.requiredColumns,
    ...Object.keys(config.cellRules),
    ...(config.addressColumns ?? []),
  ]);

  for (const canonical of canonicalNames) {
    let idx = headerRow.indexOf(canonical);

    if (idx === -1) {
      idx = headerRow.findIndex(
        (h) => h.trim().toLowerCase() === canonical.trim().toLowerCase(),
      );
    }

    if (idx === -1 && aliases[canonical]) {
      for (const alias of aliases[canonical]) {
        idx = headerRow.findIndex(
          (h) => h.trim().toLowerCase() === alias.trim().toLowerCase(),
        );
        if (idx !== -1) break;
      }
    }

    if (idx !== -1) {
      result.set(canonical, idx);
    }
  }

  return result;
}

export const LEADING_ZERO_LABEL = 'Formatação numérica pode remover zeros à esquerda — altere para "Texto" antes de importar';
export const NUMBER_AS_TEXT_LABEL = 'Número armazenado como texto — altere a formatação da célula para "Número" ou "Geral"';

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
  const rows = dataRows.slice(1) as unknown[][];

  const colIndexMap = resolveColumnIndices(headerRow, config);
  const leadingZeroCols = new Set(config.leadingZeroColumns ?? []);

  // Validação de colunas obrigatórias
  const columnErrors: ColumnError[] = [];
  for (const col of config.requiredColumns) {
    if (!colIndexMap.has(col)) {
      columnErrors.push({ column: col });
    }
  }

  // Validação de células
  const cellErrors: CellError[] = [];

  for (const [colName, rule] of Object.entries(config.cellRules)) {
    const colIdx = colIndexMap.get(colName);
    if (colIdx === undefined) continue;

    const validator = VALIDATORS[rule];
    let failCount = 0;
    let totalCount = 0;
    const details: CellErrorDetail[] = [];

    // "Número armazenado como texto"
    let textFailCount = 0;
    const textDetails: CellErrorDetail[] = [];

    // "Zeros à esquerda em risco" — coluna numérica sensível com valor typeof number
    let leadingZeroCount = 0;
    const leadingZeroDetails: CellErrorDetail[] = [];

    const isLeadingZeroSensitive = leadingZeroCols.has(colName);

    for (let i = 0; i < rows.length; i++) {
      const rawVal = rows[i][colIdx];

      let cellVal: string;
      if (rule === 'date' && typeof rawVal === 'number') {
        cellVal = excelSerialToDateString(rawVal);
      } else {
        cellVal = String(rawVal ?? '').trim();
      }

      if (cellVal === '') continue;
      totalCount++;

      // Coluna sensível a zeros à esquerda + valor numérico = zeros perdidos
      if (isLeadingZeroSensitive && typeof rawVal === 'number') {
        leadingZeroCount++;
        leadingZeroDetails.push({ row: i + 2 + config.skipRows, value: cellVal });
        continue;
      }

      // Número armazenado como texto (triângulo verde)
      if (rule === 'numbers' && typeof rawVal === 'string') {
        textFailCount++;
        textDetails.push({ row: i + 2 + config.skipRows, value: cellVal });
        continue;
      }

      if (!validator.test(cellVal)) {
        failCount++;
        details.push({ row: i + 2 + config.skipRows, value: cellVal });
      }
    }

    if (failCount > 0) {
      cellErrors.push({ column: colName, rule, ruleLabel: validator.label, failCount, totalCount, details });
    }

    if (textFailCount > 0) {
      cellErrors.push({
        column: colName, rule,
        ruleLabel: NUMBER_AS_TEXT_LABEL,
        failCount: textFailCount, totalCount, details: textDetails,
      });
    }

    // Alerta de zeros à esquerda — aparece mesmo sem erro de formato,
    // pois o valor passa na validação mas será importado sem os zeros.
    if (leadingZeroCount > 0) {
      cellErrors.push({
        column: colName, rule,
        ruleLabel: LEADING_ZERO_LABEL,
        failCount: leadingZeroCount, totalCount, details: leadingZeroDetails,
      });
    }
  }

  // Validação condicional de morada
  if (config.addressColumns) {
    const addrIndices = config.addressColumns.map((c) => ({
      name: c,
      idx: colIndexMap.get(c) ?? -1,
    }));
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
                existing = {
                  column: errorKey, rule: 'numbers',
                  ruleLabel: 'Morada obrigatória quando parcialmente preenchida',
                  failCount: 0, totalCount: rows.length, details: [],
                };
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