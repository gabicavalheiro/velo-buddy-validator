import * as XLSX from 'xlsx';
import { FileTypeConfig, VALIDATORS, CellRule } from './validationRules';

export interface ColumnError {
  column: string;
}

export interface CellError {
  column: string;
  rule: CellRule;
  ruleLabel: string;
  failCount: number;
  totalCount: number;
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

export function validateWorkbook(workbook: XLSX.WorkBook, config: FileTypeConfig): ValidationResult {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const dataRows = allRows.slice(config.skipRows);
  if (dataRows.length === 0) {
    return { success: false, columnErrors: [{ column: '(Ficheiro vazio após ignorar linhas de cabeçalho)' }], cellErrors: [], rowCount: 0 };
  }

  const headerRow = dataRows[0].map((h: any) => String(h).trim());
  const rows = dataRows.slice(1);

  // Column validation
  const columnErrors: ColumnError[] = [];
  for (const col of config.requiredColumns) {
    if (!headerRow.includes(col)) {
      columnErrors.push({ column: col });
    }
  }

  // Cell validation
  const cellErrors: CellError[] = [];
  for (const [colName, rule] of Object.entries(config.cellRules)) {
    const colIdx = headerRow.indexOf(colName);
    if (colIdx === -1) continue;

    const validator = VALIDATORS[rule];
    let failCount = 0;
    let totalCount = 0;

    for (const row of rows) {
      const cellVal = String(row[colIdx] ?? '').trim();
      if (cellVal === '') continue; // skip empty
      totalCount++;
      if (!validator.test(cellVal)) {
        failCount++;
      }
    }

    if (failCount > 0) {
      cellErrors.push({ column: colName, rule, ruleLabel: validator.label, failCount, totalCount });
    }
  }

  // Address conditional validation (Clientes e Fornecedores)
  if (config.addressColumns) {
    const addrIndices = config.addressColumns.map(c => ({ name: c, idx: headerRow.indexOf(c) }));
    const existingAddr = addrIndices.filter(a => a.idx !== -1);

    if (existingAddr.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const hasAnyAddr = existingAddr.some(a => String(row[a.idx] ?? '').trim() !== '');
        if (hasAnyAddr) {
          for (const addr of existingAddr) {
            const val = String(row[addr.idx] ?? '').trim();
            if (val === '') {
              // Find or create a cell error for this address column
              let existing = cellErrors.find(e => e.column === `${addr.name} (morada incompleta)`);
              if (!existing) {
                existing = { column: `${addr.name} (morada incompleta)`, rule: 'numbers', ruleLabel: 'Morada obrigatória quando parcialmente preenchida', failCount: 0, totalCount: rows.length };
                cellErrors.push(existing);
              }
              existing.failCount++;
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
