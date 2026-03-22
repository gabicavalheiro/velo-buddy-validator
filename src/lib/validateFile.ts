import * as XLSX from 'xlsx';
import { FileTypeConfig, VALIDATORS, CellRule } from './validationRules';

export interface ColumnError    { column: string }
export interface CellErrorDetail { row: number; value: string }
export interface CellError {
  column: string; rule: CellRule; ruleLabel: string;
  failCount: number; totalCount: number; details: CellErrorDetail[];
}
export interface ValidationResult {
  success: boolean; columnErrors: ColumnError[];
  cellErrors: CellError[]; rowCount: number;
}

export const NUMBER_AS_TEXT_PREFIX   = 'Número armazenado como texto';
export const DATE_AS_SERIAL_LABEL    = 'Data em formato incorreto — formate a coluna como Data no padrão AAAA-MM-DD (ex: 2024-12-31)';
export const REQUIRED_VALUE_LABEL    = 'Campo obrigatório — esta coluna não pode ter linhas em branco';
export const INSTRUCTION_ROW_LABEL   = 'A linha 2 parece conter instruções de preenchimento e não dados reais — apague essa linha antes de importar';
export const LEADING_ZERO_LABEL      = 'Esta coluna deve estar formatada como "Texto" no Excel — valores numéricos perdem os zeros à esquerda (ex: CPF "04652781407" vira "4652781407")';
export const DATE_WRONG_FORMAT_LABEL = 'Data em formato incorreto — formate a coluna como Data no padrão AAAA-MM-DD (ex: 2024-12-31)';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try { resolve(XLSX.read(new Uint8Array(e.target!.result as ArrayBuffer), { type: 'array' })); }
      catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

const toDateStr = (serial: number): string => {
  const d = XLSX.SSF.parse_date_code(serial);
  return d ? `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}` : String(serial);
};

const normalize = (s: string) =>
  s.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim()
   .replace(/\s+/g, ' ').toLowerCase()
   .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const makeError = (column: string, rule: CellRule, ruleLabel: string, details: CellErrorDetail[], totalCount: number): CellError =>
  ({ column, rule, ruleLabel, failCount: details.length, totalCount, details });

const primaryRule = (rule: CellRule | CellRule[]): CellRule =>
  Array.isArray(rule) ? rule[0] : rule;

// ─── Resolução de colunas ─────────────────────────────────────────────────────

function resolveColumnIndices(headerRow: string[], config: FileTypeConfig): Map<string, number> {
  const norm = headerRow.map(normalize);
  const aliases = config.columnAliases ?? {};

  const canonicals = new Set([
    ...config.requiredColumns, ...Object.keys(config.cellRules),
    ...(config.addressColumns ?? []), ...(config.requiredValueColumns ?? []),
  ]);

  return new Map(
    [...canonicals].flatMap(canonical => {
      const idx =
        headerRow.indexOf(canonical) !== -1 ? headerRow.indexOf(canonical) :
        norm.findIndex(h => h === normalize(canonical)) !== -1 ? norm.findIndex(h => h === normalize(canonical)) :
        (aliases[canonical] ?? []).reduce<number>((f, a) => f !== -1 ? f : norm.findIndex(h => h === normalize(a)), -1);
      return idx !== -1 ? [[canonical, idx]] : [];
    })
  );
}

// ─── Detecção de linha de instruções ─────────────────────────────────────────

const INSTRUCTION_KEYWORDS = [
  'obrigatório','obrigatorio','use a formatação','use a formatacao',
  'campo de texto','informe','utilize o padrão','utilize o padrao',
  'caracteres','separe as casas','recomenda-se',
];

function detectInstructionRow(rows: unknown[][]): CellError | null {
  const cells = (rows[0] as unknown[]).map(v => String(v ?? '').trim()).filter(Boolean);
  if (!cells.length) return null;

  const isInstruction =
    cells.filter(v => v.length > 40).length >= 2 ||
    cells.some(v => INSTRUCTION_KEYWORDS.some(kw => v.toLowerCase().includes(kw)));

  if (!isInstruction) return null;

  const sample = cells[0];
  return makeError('Linha 2', 'numbers', INSTRUCTION_ROW_LABEL,
    [{ row: 2, value: sample.slice(0, 80) + (sample.length > 80 ? '…' : '') }], 1);
}

// ─── Validação de coluna ──────────────────────────────────────────────────────

const KG_ALIASES = new Set(['kg','kilo','quilograma','quilogramas','kilograma','kilogramas']);

function validateColumn(
  colName: string, rule: CellRule, colIdx: number,
  rows: unknown[][], config: FileTypeConfig,
  isLeadingZero: boolean, unitColIdx?: number,
): CellError[] {
  const validator = VALIDATORS[rule];
  const d: Record<string, CellErrorDetail[]> = {
    invalid: [], numberText: [], leadingZero: [], dateSerial: [], dateFormat: [],
  };
  let total = 0;

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i][colIdx];
    const val = String(raw ?? '').trim();
    if (!val) continue;
    total++;
    const rowNum = i + 2 + config.skipRows;
    const detail = { row: rowNum, value: val };

    if (rule === 'date' && typeof raw === 'number')        { d.dateSerial.push({ ...detail, value: toDateStr(raw) }); continue; }
    if (isLeadingZero)                                     { if (typeof raw === 'number') d.leadingZero.push(detail); continue; }
    if (typeof raw === 'string' && rule !== 'date' && rule !== 'text') { d.numberText.push(detail); continue; }

    if (rule === 'stock') {
      const unit = unitColIdx != null ? String(rows[i][unitColIdx] ?? '').trim().toLowerCase() : '';
      const num  = Number(val);
      if (!Number.isFinite(num) || (!KG_ALIASES.has(unit) && !Number.isInteger(num))) d.invalid.push(detail);
      continue;
    }

    if (!validator.test(val)) (rule === 'date' ? d.dateFormat : d.invalid).push(detail);
  }

  return ([
    [d.invalid,     validator.label],
    [d.numberText,  VALIDATORS[rule].numberAsTextLabel],
    [d.leadingZero, LEADING_ZERO_LABEL],
    [d.dateSerial,  DATE_AS_SERIAL_LABEL],
    [d.dateFormat,  DATE_WRONG_FORMAT_LABEL],
  ] as [CellErrorDetail[], string][])
    .filter(([details, label]) => details.length > 0 && label)
    .map(([details, label]) => makeError(colName, rule, label, details, total));
}

// ─── validateWorkbook ─────────────────────────────────────────────────────────

export function validateWorkbook(workbook: XLSX.WorkBook, config: FileTypeConfig): ValidationResult {
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const allRows  = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const dataRows = allRows.slice(config.skipRows);

  if (!dataRows.length) return {
    success: false, rowCount: 0, cellErrors: [],
    columnErrors: [{ column: '(Ficheiro vazio após ignorar linhas de cabeçalho)' }],
  };

  const headerRow = (dataRows[0] as unknown[]).map(h => String(h).trim());
  const rawRows   = dataRows.slice(1) as unknown[][];

  let lastFilled  = rawRows.length - 1;
  while (lastFilled >= 0 && !(rawRows[lastFilled] as unknown[]).some(v => String(v ?? '').trim())) lastFilled--;
  const rows = rawRows.slice(0, lastFilled + 1);

  const colMap    = resolveColumnIndices(headerRow, config);
  const instrErr  = detectInstructionRow(rows);
  if (instrErr) return { success: false, columnErrors: [], cellErrors: [instrErr], rowCount: rows.length - 1 };

  const columnErrors = config.requiredColumns
    .filter(col => !colMap.has(col))
    .map(col => ({ column: col }));

  const leadingZeroCols = new Set(config.leadingZeroColumns ?? []);
  const unitColIdx      = config.unitColumn ? colMap.get(config.unitColumn) : undefined;
  const cellErrors: CellError[] = [];

  // Validação por cellRules
  for (const [colName, rule] of Object.entries(config.cellRules)) {
    const colIdx = colMap.get(colName);
    if (colIdx === undefined) continue;
    cellErrors.push(...validateColumn(colName, primaryRule(rule), colIdx, rows, config, leadingZeroCols.has(colName), unitColIdx));
  }

  // Varredura universal — colunas fora do cellRules
  const checked = new Set(
    [...Object.keys(config.cellRules), ...(config.leadingZeroColumns ?? [])]
      .map(n => colMap.get(n)).filter((i): i is number => i !== undefined)
  );

  for (let ci = 0; ci < headerRow.length; ci++) {
    if (checked.has(ci)) continue;
    const label   = headerRow[ci] || `Coluna ${ci + 1}`;
    const details = rows.flatMap((row, i) => {
      const raw = row[ci];
      return typeof raw === 'string' && /^-?\d+([.,]\d+)?$/.test(raw.trim())
        ? [{ row: i + 2 + config.skipRows, value: raw.trim() }] : [];
    });
    if (!details.length) continue;
    const rule = primaryRule((config.cellRules[label] as CellRule | CellRule[] | undefined) ?? 'numbers');
    cellErrors.push(makeError(label, rule,
      VALIDATORS[rule].numberAsTextLabel || VALIDATORS.numbers.numberAsTextLabel,
      details, rows.length));
  }

  // Campos obrigatórios por linha
  for (const colName of config.requiredValueColumns ?? []) {
    const colIdx = colMap.get(colName);
    if (colIdx === undefined) continue;
    const details = rows
      .map((row, i) => ({ row: i + 2 + config.skipRows, val: String(row[colIdx] ?? '').trim() }))
      .filter(({ val }) => !val)
      .map(({ row }) => ({ row, value: '(vazio)' }));
    if (details.length) cellErrors.push(makeError(colName, 'numbers', REQUIRED_VALUE_LABEL, details, rows.length));
  }

  // Endereço condicional
  const addrCols = (config.addressColumns ?? [])
    .map(c => ({ name: c, idx: colMap.get(c) ?? -1 }))
    .filter(a => a.idx !== -1);

  for (let i = 0; i < rows.length; i++) {
    if (!addrCols.some(a => String(rows[i][a.idx] ?? '').trim())) continue;
    for (const addr of addrCols) {
      if (String(rows[i][addr.idx] ?? '').trim()) continue;
      const key = `${addr.name} (morada incompleta)`;
      let err = cellErrors.find(e => e.column === key);
      if (!err) { err = makeError(key, 'numbers', 'Morada obrigatória quando parcialmente preenchida', [], rows.length); cellErrors.push(err); }
      err.failCount++;
      err.details.push({ row: i + 2 + config.skipRows, value: '(vazio)' });
    }
  }

  return {
    success: columnErrors.length === 0 && cellErrors.length === 0,
    columnErrors, cellErrors, rowCount: rows.length,
  };
}