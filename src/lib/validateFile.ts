// Lê o ficheiro Excel/CSV e aplica as regras de validação definidas em validationRules, devolvendo o resultado da validação.
import * as XLSX from 'xlsx';
import { FileTypeConfig, VALIDATORS, CellRule } from './validationRules';

export interface ColumnError {
  column: string;
}

export interface CellErrorDetail {
  row: number; // 1-based row number in the data (after skipped rows)
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

function normalizeHeaderName(value: unknown): string {
  // Normaliza espaços, caixa e acentuação para comparação mais tolerante
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findColumnIndex(
  headerRow: string[],
  canonicalName: string,
  columnAliases?: Record<string, string[]>,
): number {
  const candidates = [canonicalName, ...(columnAliases?.[canonicalName] ?? [])].map(normalizeHeaderName);
  const normalizedHeader = headerRow.map(normalizeHeaderName);
  for (const name of candidates) {
    const idx = normalizedHeader.indexOf(name);
    if (idx !== -1) return idx;
  }
  return -1;
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

export function validateWorkbook(workbook: XLSX.WorkBook, config: FileTypeConfig): ValidationResult {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // Usamos raw: false e dateNF para que datas venham já formatadas como texto "AAAA-MM-DD"
  const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  const dataRows = allRows.slice(config.skipRows);
  if (dataRows.length === 0) {
    return { success: false, columnErrors: [{ column: '(Ficheiro vazio após ignorar linhas de cabeçalho)' }], cellErrors: [], rowCount: 0 };
  }

  const headerRow = dataRows[0].map((h: any) => normalizeHeaderName(h));
  const rows = dataRows.slice(1);

  // Column validation
  const columnErrors: ColumnError[] = [];
  for (const col of config.requiredColumns) {
    const colIdx = findColumnIndex(headerRow, col, config.columnAliases);
    if (colIdx === -1) {
      columnErrors.push({ column: col });
    }
  }

  // Cell validation
  const cellErrors: CellError[] = [];
  for (const [colName, rule] of Object.entries(config.cellRules)) {
    const colIdx = findColumnIndex(headerRow, colName, config.columnAliases);
    if (colIdx === -1) continue;

    const validator = VALIDATORS[rule];
    let failCount = 0;
    let totalCount = 0;
    const details: CellErrorDetail[] = [];
    let hasTextStorageIssue = false;

    for (let i = 0; i < rows.length; i++) {
      const originalCell = rows[i][colIdx];
      const rawVal = String(originalCell ?? '').trim();
      if (rawVal === '') continue;

      // Normalização específica por tipo de regra
      let valueForValidation = rawVal;
      if (rule === 'currency') {
        // Remove símbolo de moeda, espaços e separador de milhar, mantendo apenas parte numérica
        valueForValidation = rawVal
          .replace(/R\$\s*/i, '')
          .replace(/\s+/g, '')
          .replace(/\./g, '') // remove milhar
          .replace(',', '.'); // usa . como separador decimal
      }

      totalCount++;
      // Para qualquer coluna numérica, também consideramos erro quando o Excel
      // armazenou o valor como texto (por exemplo, "número armazenado como texto").
      const storedAsTextButShouldBeNumber =
        rule === 'numbers' && typeof originalCell === 'string' && validator.test(valueForValidation);

      if (!validator.test(valueForValidation) || storedAsTextButShouldBeNumber) {
        if (storedAsTextButShouldBeNumber) {
          hasTextStorageIssue = true;
        }
        failCount++;
        details.push({ row: i + 2 + config.skipRows, value: rawVal });
      }
    }

    if (failCount > 0) {
      const ruleLabel =
        hasTextStorageIssue && rule === 'numbers'
          ? 'Número armazenado como texto no Excel'
          : validator.label;

      cellErrors.push({ column: colName, rule, ruleLabel, failCount, totalCount, details });
    }
  }

  // Address conditional validation
  if (config.addressColumns) {
    const addrIndices = config.addressColumns.map(c => ({
      name: c,
      idx: findColumnIndex(headerRow, c, config.columnAliases),
    }));
    const existingAddr = addrIndices.filter(a => a.idx !== -1);

    if (existingAddr.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const hasAnyAddr = existingAddr.some(a => String(row[a.idx] ?? '').trim() !== '');
        if (hasAnyAddr) {
          for (const addr of existingAddr) {
            const val = String(row[addr.idx] ?? '').trim();
            if (val === '') {
              const errorKey = `${addr.name} (morada incompleta)`;
              let existing = cellErrors.find(e => e.column === errorKey);
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
