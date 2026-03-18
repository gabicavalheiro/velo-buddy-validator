import * as XLSX from 'xlsx';
import { FileTypeConfig, VALIDATORS, CellRule } from './validationRules';

// ─── Interfaces ───────────────────────────────────────────────────────────────

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

// Alerta: problema não-bloqueante — não impede a importação
export interface CellWarning {
  column: string;
  warningLabel: string;
  failCount: number;
  details: CellErrorDetail[];
}

export interface ValidationResult {
  success: boolean;
  columnErrors: ColumnError[];
  cellErrors: CellError[];
  cellWarnings: CellWarning[]; // Alertas NÃO afetam o success
  rowCount: number;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

/**
 * Sanitiza nomes de clientes/fornecedores.
 * Remove caracteres de controle ASCII e não-imprimíveis de encodings corrompidos.
 * Mantém letras (incluindo acentos Unicode), números, pontuação e espaços.
 * Normaliza espaços múltiplos.
 *
 * Exemplos:
 *   "Jo\x00ão Silva"  → "João Silva"
 *   "Maria  Souza"    → "Maria Souza"
 *   "Pedro\x1FAlves"  → "PedroAlves"
 */
function sanitizeName(val: string): string {
  return val
    .replace(/[\x00-\x1F\x7F]/g, '')            // controles ASCII
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '')    // só printáveis Unicode
    .replace(/\s{2,}/g, ' ')                      // colapsa espaços múltiplos
    .trim();
}

// Colunas de nome que passam pela sanitização automática
const NAME_COLUMNS = new Set(['Nome/Razão Social', 'Nome Fantasia', 'Nome']);

// ─── Parsing ──────────────────────────────────────────────────────────────────

export function parseFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: 'array',
          // cellDates: false → datas lidas como string AAAA-MM-DD, não como Date object
          // Evita falsos erros quando a célula está formatada como texto no Excel
          cellDates: false,
          raw: false,
        });
        resolve(workbook);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─── Validação principal ──────────────────────────────────────────────────────

export function validateWorkbook(workbook: XLSX.WorkBook, config: FileTypeConfig): ValidationResult {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const dataRows = allRows.slice(config.skipRows);

  if (dataRows.length === 0) {
    return {
      success: false,
      columnErrors: [{ column: '(Ficheiro vazio após ignorar linhas de cabeçalho)' }],
      cellErrors: [],
      cellWarnings: [],
      rowCount: 0,
    };
  }

  const headerRow = dataRows[0].map((h: any) => String(h).trim());
  const rows = dataRows.slice(1);

  // ── 1. Colunas obrigatórias ──────────────────────────────────────────────
  const columnErrors: ColumnError[] = [];
  for (const col of config.requiredColumns) {
    if (!headerRow.includes(col)) {
      columnErrors.push({ column: col });
    }
  }

  // ── 2. Validação de células ──────────────────────────────────────────────
  const cellErrors: CellError[] = [];
  const cellWarnings: CellWarning[] = [];

  for (const [colName, rule] of Object.entries(config.cellRules)) {
    const colIdx = headerRow.indexOf(colName);
    if (colIdx === -1) continue;

    const validator = VALIDATORS[rule];
    let failCount = 0;
    let totalCount = 0;
    const details: CellErrorDetail[] = [];

    for (let i = 0; i < rows.length; i++) {
      let cellVal = String(rows[i][colIdx] ?? '').trim();

      // Sanitização automática em campos de nome
      if (NAME_COLUMNS.has(colName)) {
        cellVal = sanitizeName(cellVal);
      }

      // Células vazias são ignoradas (campos opcionais não geram erro)
      if (cellVal === '') continue;

      totalCount++;

      if (!validator.test(cellVal)) {
        failCount++;
        details.push({ row: i + 2 + config.skipRows, value: cellVal });
      }
    }

    if (failCount > 0) {
      cellErrors.push({ column: colName, rule, ruleLabel: validator.label, failCount, totalCount, details });
    }
  }

  // ── 3. Endereço incompleto → ALERTA (não erro) ───────────────────────────
  //
  // Se ao menos um campo de endereço estiver preenchido na linha,
  // mas outro campo de endereço da mesma linha estiver vazio → Alerta.
  //
  // NÃO bloqueia a importação: o sistema Velo importa esses dados
  // automaticamente para o campo Observações.
  if (config.addressColumns) {
    const addrIndices = config.addressColumns.map((c) => ({ name: c, idx: headerRow.indexOf(c) }));
    const existingAddr = addrIndices.filter((a) => a.idx !== -1);

    if (existingAddr.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const hasAnyAddr = existingAddr.some((a) => String(row[a.idx] ?? '').trim() !== '');

        if (hasAnyAddr) {
          for (const addr of existingAddr) {
            const val = String(row[addr.idx] ?? '').trim();

            if (val === '') {
              const warningKey = `${addr.name} (endereço incompleto)`;
              let existing = cellWarnings.find((w) => w.column === warningKey);

              if (!existing) {
                existing = {
                  column: warningKey,
                  warningLabel: 'Campo de endereço vazio em linha com endereço parcial — será importado para Observações',
                  failCount: 0,
                  details: [],
                };
                cellWarnings.push(existing);
              }

              existing.failCount++;
              existing.details.push({ row: i + 2 + config.skipRows, value: '(vazio)' });
            }
          }
        }
      }
    }
  }

  // Alertas (cellWarnings) NÃO afetam o success
  return {
    success: columnErrors.length === 0 && cellErrors.length === 0,
    columnErrors,
    cellErrors,
    cellWarnings,
    rowCount: rows.length,
  };
}