// src/lib/validateFile.ts
import * as XLSX from 'xlsx';
import { FileTypeConfig, VALIDATORS, CellRule } from './validationRules';

export interface ColumnError     { column: string }
export interface CellErrorDetail { row: number; value: string; colName?: string }
export type CellErrorSeverity = 'error' | 'warning';
export interface CellError {
  column: string; rule: CellRule; ruleLabel: string;
  failCount: number; totalCount: number; details: CellErrorDetail[];
  // 'warning'  → apenas um alerta informativo, não impede a importação (ex: coluna
  //              armazenada como Número que PODERIA perder um zero à esquerda).
  // 'error'    → problema real que precisa ser corrigido antes de importar.
  // Ausente/undefined é tratado como 'error' (compatibilidade com código antigo).
  severity: CellErrorSeverity;
}
export interface ValidationResult {
  success: boolean; columnErrors: ColumnError[];
  cellErrors: CellError[]; rowCount: number;
  // Linhas "fantasma": o Excel registra a planilha como tendo mais linhas do
  // que as que realmente têm dado (comum quando alguém aplica formatação —
  // cor, borda, formato de número — numa faixa grande de células vazias).
  // Essas linhas são descartadas na validação, mas alguns sistemas de
  // importação leem a dimensão bruta do arquivo e acabam processando-as
  // mesmo assim. ghostRowCount informa quantas foram detectadas e ignoradas.
  ghostRowCount: number;
}

export const NUMBER_AS_TEXT_PREFIX   = 'Número armazenado como texto';
export const DATE_AS_SERIAL_LABEL    = 'Data em formato incorreto — formate a coluna como Data no padrão AAAA-MM-DD (ex: 2024-12-31)';
export const REQUIRED_VALUE_LABEL    = 'Campo obrigatório — esta coluna não pode ter linhas em branco';
export const INSTRUCTION_ROW_LABEL   = 'A linha 2 parece conter instruções de preenchimento e não dados reais — apague essa linha antes de importar';
export const LEADING_ZERO_LABEL      = 'Aviso: esta coluna está armazenada como Número no Excel. Isso só é um problema se algum valor começar com "0" — nesse caso, o zero à esquerda seria perdido (ex: CPF "04652781407" viraria "4652781407"). Se nenhum valor começa com zero, pode ignorar. Recomendado formatar como "Texto" para evitar o risco.';
export const DATE_WRONG_FORMAT_LABEL = 'Data em formato incorreto — formate a coluna como Data no padrão AAAA-MM-DD (ex: 2024-12-31)';
export const CHAR_LIMIT_LABEL        = (limit: number) => `Texto excede o limite de ${limit} caracteres permitidos`;

export const INVALID_CHAR_LABEL   = 'Caractere inválido encontrado — remova ou substitua pelo equivalente comum (ex: aspas tipográficas, símbolos especiais)';
export const INVISIBLE_CHAR_LABEL = 'Caractere invisível encontrado — pode causar falhas silenciosas na importação (ex: espaço não-separável, zero-width space, BOM)';
export const FRACTIONAL_STOCK_UNIT_LABEL =
  'Quantidade em estoque fracionada — quando a Unidade informada nessa linha é "Unidade" (UN), o estoque não pode ter casas decimais (ex: 10, não 10,5)';
export const SUPPLIER_TYPE_LABEL = 'Tipo de fornecedor obrigatório quando Fornecedor = 1';

// ─── Whitelist de caracteres visíveis permitidos ──────────────────────────────
const VISIBLE_ALLOWED_RE =
  /[^a-zA-Z0-9 .,\-/()'":;@_#+=!?&%\xC0-\xC3\xC7\xC9\xCA\xCD\xD3-\xD5\xDA\xDC\xE0-\xE3\xE7\xE9\xEA\xED\xF3-\xF5\xFA\xFC]/g;

const INVISIBLE_CPS = new Set([
  0x00A0, 0x00AD, 0x202F, 0x205F, 0x3000,
  0x2000, 0x2001, 0x2002, 0x2003, 0x2004,
  0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
  0x200B, 0x200C, 0x200D, 0x200E, 0x200F,
  0x2028, 0x2029,
  0x202A, 0x202B, 0x202C, 0x202D, 0x202E,
  0x2060, 0xFEFF,
  0x3164, 0xFFA0, 0x115F, 0x1160,
]);

// ─── Nomes amigáveis para caracteres invisíveis ───────────────────────────────
const INVISIBLE_NAMES: Record<number, string> = {
  0x00A0: 'NBSP',       // Non-Breaking Space
  0x00AD: 'SHY',        // Soft Hyphen
  0x202F: 'NNBSP',      // Narrow No-Break Space
  0x205F: 'MMSP',       // Medium Mathematical Space
  0x3000: 'IDSP',       // Ideographic Space
  0x200B: 'ZWSP',       // Zero Width Space
  0x200C: 'ZWNJ',       // Zero Width Non-Joiner
  0x200D: 'ZWJ',        // Zero Width Joiner
  0x200E: 'LRM',        // Left-to-Right Mark
  0x200F: 'RLM',        // Right-to-Left Mark
  0xFEFF: 'BOM',        // Byte Order Mark / Zero Width No-Break Space
  0x2060: 'WJ',         // Word Joiner
};

interface CharScanResult {
  invalidChars:   string[];
  invisibleChars: string[];
}

function scanSpecialChars(val: string): CharScanResult {
  const invalid   = new Set<string>();
  const invisible = new Set<string>();

  const matches = val.match(VISIBLE_ALLOWED_RE);
  if (!matches) return { invalidChars: [], invisibleChars: [] };

  for (const ch of matches) {
    const cp = ch.codePointAt(0) ?? 0;
    if (INVISIBLE_CPS.has(cp) || cp < 0x20) {
      invisible.add(`[U+${cp.toString(16).toUpperCase().padStart(4, '0')}]`);
    } else {
      invalid.add(`"${ch}" (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`);
    }
  }

  return { invalidChars: [...invalid], invisibleChars: [...invisible] };
}

// ─── Marca caracteres invisíveis inline no texto ──────────────────────────────
function markInvisibleChars(val: string): string {
  let result = '';
  for (const ch of val) {
    const cp = ch.codePointAt(0) ?? 0;
    if (INVISIBLE_CPS.has(cp) || cp < 0x20) {
      const name = INVISIBLE_NAMES[cp];
      result += name
        ? `[${name}]`
        : `[U+${cp.toString(16).toUpperCase().padStart(4, '0')}]`;
    } else {
      result += ch;
    }
  }
  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(XLSX.read(new Uint8Array(e.target!.result as ArrayBuffer), {
          type: 'array',
          cellDates: true, // SheetJS entrega Date objects em vez de serial numérico
        }));
      }
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

const wordKey = (s: string) =>
  normalize(s).replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

const slugKey = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');

const makeError = (
  column: string, rule: CellRule, ruleLabel: string, details: CellErrorDetail[], totalCount: number,
  severity: CellErrorSeverity = 'error',
): CellError =>
  ({ column, rule, ruleLabel, failCount: details.length, totalCount, details, severity });

const primaryRule = (rule: CellRule | CellRule[]): CellRule =>
  Array.isArray(rule) ? rule[0] : rule;

// ─── Resolução de colunas (6 estratégias) ─────────────────────────────────────
//
// 1) Nome exato                 2) Nome normalizado (acentos/caixa/espaços)
// 3) Alias configurado          4) "Word key" (palavras reordenadas)
// 5) "Slug key" (tudo junto)    6) Contém — fallback: cabeçalho contém o nome
//    canônico/alias como substring (ex: "Produto Ativo?", "Situação/Ativo",
//    texto colado por caractere invisível residual etc.)
//
// A estratégia 6 só entra em ação para colunas que NÃO encontraram match nas
// 5 estratégias exatas, e nunca reutiliza um índice já reivindicado por um
// match exato de outra coluna — evita "roubar" a coluna errada quando há
// nomes parecidos (ex: "Preço Custo" vs "Preço Venda").

function resolveColumnIndices(headerRow: string[], config: FileTypeConfig): Map<string, number> {
  const norm    = headerRow.map(normalize);
  const wkeys   = headerRow.map(wordKey);
  const skeys   = headerRow.map(slugKey);
  const aliases = config.columnAliases ?? {};

  const canonicals = new Set([
    ...config.requiredColumns,
    ...Object.keys(config.cellRules),
    ...(config.addressColumns ?? []),
    ...(config.requiredValueColumns ?? []),
    ...Object.keys(config.charLimits ?? {}),
  ]);

  const claimedExact = new Set<number>();
  const resolved: [string, number][] = [];
  const pendingContains: string[] = [];

  for (const canonical of canonicals) {
    const normC  = normalize(canonical);
    const wkeyC  = wordKey(canonical);
    const skeyC  = slugKey(canonical);
    const aliasC = aliases[canonical] ?? [];

    let idx = -1;

    if (idx === -1) idx = headerRow.indexOf(canonical);
    if (idx === -1) idx = norm.findIndex(h => h === normC);
    if (idx === -1) idx = aliasC.reduce<number>((f, a) => f !== -1 ? f : norm.findIndex(h => h === normalize(a)), -1);
    if (idx === -1) idx = wkeys.findIndex(w => w === wkeyC);
    if (idx === -1) idx = skeys.findIndex(s => s === skeyC);

    if (idx !== -1) {
      resolved.push([canonical, idx]);
      claimedExact.add(idx);
    } else {
      pendingContains.push(canonical);
    }
  }

  // ── Estratégia 6: contains (apenas para quem sobrou sem match exato) ──────
  for (const canonical of pendingContains) {
    const skeyC      = slugKey(canonical);
    const aliasSkeys = (aliases[canonical] ?? []).map(slugKey).filter(Boolean);

    if (!skeyC && aliasSkeys.length === 0) continue;

    const idx = skeys.findIndex((s, i) => {
      if (!s || claimedExact.has(i)) return false;
      if (skeyC && (s.includes(skeyC) || skeyC.includes(s))) return true;
      return aliasSkeys.some(a => s.includes(a) || a.includes(s));
    });

    if (idx !== -1) {
      resolved.push([canonical, idx]);
      claimedExact.add(idx);
    }
  }

  return new Map(resolved);
}

// ─── Detecção de linha de instruções ─────────────────────────────────────────

const INSTRUCTION_KEYWORDS = [
  'obrigatório','obrigatorio','use a formatação','use a formatacao',
  'campo de texto','informe','utilize o padrão','utilize o padrao',
  'caracteres','separe as casas','recomenda-se',
];

function detectInstructionRow(rows: unknown[][]): CellError | null {
  const cells = (rows[0] as unknown[])
    .map(v => {
      if (v instanceof Date) return ''; // Date object não é instrução
      return String(v ?? '').trim();
    })
    .filter(Boolean);

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

// Valores da coluna "Unidade" que representam o tipo de medida "Unidade" (UN) —
// é SOMENTE nesse caso que o estoque não pode ser fracionado. Qualquer outra
// unidade (Kg, L, Cx, Pc de peso variável, etc.) pode ter casas decimais.
const UNIDADE_TYPE_ALIASES = new Set(['un', 'und', 'unid', 'unidade']);

function validateColumn(
  colName: string, rule: CellRule, colIdx: number,
  rows: unknown[][], config: FileTypeConfig,
  isLeadingZero: boolean, unitColIdx?: number,
): CellError[] {
  const validator = VALIDATORS[rule];
  const d: Record<string, CellErrorDetail[]> = {
    invalid: [], numberText: [], leadingZero: [], dateSerial: [], dateFormat: [], fractionalUnit: [],
  };
  let total = 0;

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i][colIdx];
    const val = String(raw ?? '').trim();
    if (!val) continue;
    total++;
    const rowNum = i + 2 + config.skipRows;
    const detail: CellErrorDetail = { row: rowNum, value: val, colName };

    // ── Datas ────────────────────────────────────────────────────────────────
    if (rule === 'date') {
      if (raw instanceof Date) {
        const y  = raw.getFullYear();
        const m  = String(raw.getMonth() + 1).padStart(2, '0');
        const d2 = String(raw.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d2}`;
        if (!VALIDATORS.date.test(dateStr)) d.dateFormat.push({ ...detail, value: dateStr });
      } else if (typeof raw === 'number') {
        d.dateSerial.push({ ...detail, value: toDateStr(raw) });
      } else if (typeof raw === 'string') {
        if (!VALIDATORS.date.test(val)) d.dateFormat.push(detail);
      }
      continue;
    }

    // ── Zeros à esquerda ─────────────────────────────────────────────────────
    if (isLeadingZero) { if (typeof raw === 'number') d.leadingZero.push(detail); continue; }

    // ── Número armazenado como texto ─────────────────────────────────────────
    if (typeof raw === 'string' && rule !== 'text') { d.numberText.push(detail); continue; }

    // ── Stock ────────────────────────────────────────────────────────────────
    if (rule === 'stock') {
      const unitRaw = unitColIdx != null ? String(rows[i][unitColIdx] ?? '').trim() : '';
      const unit    = unitRaw.toLowerCase();
      const num     = Number(val);

      if (!Number.isFinite(num)) { d.invalid.push(detail); continue; }

      // Regra de negócio: fracionamento só é proibido quando a Unidade da
      // linha é "Unidade" (UN). Para qualquer outra unidade (Kg, L, Cx, etc.),
      // valores decimais são válidos.
      if (UNIDADE_TYPE_ALIASES.has(unit) && !Number.isInteger(num)) {
        d.fractionalUnit.push({
          ...detail,
          value: `${val}  →  Unidade: "${unitRaw || '—'}"`,
        });
      }
      continue;
    }

    // ── Regra genérica ───────────────────────────────────────────────────────
    if (!validator.test(val)) d.invalid.push(detail);
  }

  return ([
    [d.invalid,        validator.label,                'error'  ],
    [d.numberText,     VALIDATORS[rule].numberAsTextLabel, 'warning'],
    [d.leadingZero,    LEADING_ZERO_LABEL,              'warning'],
    [d.dateSerial,     DATE_AS_SERIAL_LABEL,            'error'  ],
    [d.dateFormat,     DATE_WRONG_FORMAT_LABEL,         'error'  ],
    [d.fractionalUnit, FRACTIONAL_STOCK_UNIT_LABEL,     'error'  ],
  ] as [CellErrorDetail[], string, CellErrorSeverity][])
    .filter(([details, label]) => details.length > 0 && label)
    .map(([details, label, severity]) => makeError(colName, rule, label, details, total, severity));
}

// ─── validateWorkbook ─────────────────────────────────────────────────────────

export function validateWorkbook(workbook: XLSX.WorkBook, config: FileTypeConfig): ValidationResult {
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const allRows  = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const dataRows = allRows.slice(config.skipRows);

  if (!dataRows.length) return {
    success: false, rowCount: 0, cellErrors: [], ghostRowCount: 0,
    columnErrors: [{ column: '(Ficheiro vazio após ignorar linhas de cabeçalho)' }],
  };

  const headerRow = (dataRows[0] as unknown[]).map(h => String(h).trim());
  const rawRows   = dataRows.slice(1) as unknown[][];

  let lastFilled  = rawRows.length - 1;
  while (lastFilled >= 0 && !(rawRows[lastFilled] as unknown[]).some(v => String(v ?? '').trim())) lastFilled--;
  const rows = rawRows.slice(0, lastFilled + 1);

  // "Linhas fantasma": a planilha registra mais linhas do que as que têm dado
  // de fato (comum quando formatação — cor, borda, formato de número — é
  // aplicada numa faixa grande de células vazias). São descartadas aqui, mas
  // avisamos o usuário porque outros sistemas de importação podem não fazer
  // esse mesmo descarte.
  const ghostRowCount = rawRows.length - rows.length;

  const colMap   = resolveColumnIndices(headerRow, config);
  const instrErr = detectInstructionRow(rows);
  if (instrErr) return { success: false, columnErrors: [], cellErrors: [instrErr], rowCount: rows.length - 1, ghostRowCount };

  // Mapa reverso índice → nome canônico. Usado para que TODOS os tipos de erro
  // (cellRules, número-como-texto, caractere inválido/invisível, limite de
  // caracteres) se refiram à mesma coluna sempre com o mesmo rótulo — em vez de
  // misturar o nome canônico configurado com o texto literal do cabeçalho da
  // planilha (o que fazia "Descrição do produto" e "Descrição do Produto"
  // aparecerem como se fossem colunas diferentes).
  const idxToCanonical = new Map<number, string>();
  for (const [name, idx] of colMap) idxToCanonical.set(idx, name);
  const labelForCol = (ci: number): string =>
    idxToCanonical.get(ci) ?? headerRow[ci] ?? `Coluna ${ci + 1}`;

  const columnErrors = config.requiredColumns
    .filter(col => !colMap.has(col))
    .map(col => ({ column: col }));

  const leadingZeroCols = new Set(config.leadingZeroColumns ?? []);
  const unitColIdx      = config.unitColumn ? colMap.get(config.unitColumn) : undefined;
  const cellErrors: CellError[] = [];

  // ── Validação por cellRules ───────────────────────────────────────────────
  for (const [colName, rule] of Object.entries(config.cellRules)) {
    const colIdx = colMap.get(colName);
    if (colIdx === undefined) continue;
    cellErrors.push(...validateColumn(colName, primaryRule(rule), colIdx, rows, config, leadingZeroCols.has(colName), unitColIdx));
  }

  // ── Varredura universal: número armazenado como texto ─────────────────────
  const checkedForNumText = new Set(
    [...Object.keys(config.cellRules), ...(config.leadingZeroColumns ?? [])]
      .map(n => colMap.get(n)).filter((i): i is number => i !== undefined)
  );

  for (let ci = 0; ci < headerRow.length; ci++) {
    if (checkedForNumText.has(ci)) continue;
    const label   = labelForCol(ci);
    const details = rows.flatMap((row, i) => {
      const raw = row[ci];
      return typeof raw === 'string' && /^-?\d+([.,]\d+)?$/.test(raw.trim())
        ? [{ row: i + 2 + config.skipRows, value: raw.trim(), colName: label }] : [];
    });
    if (!details.length) continue;
    const rule = primaryRule((config.cellRules[label] as CellRule | CellRule[] | undefined) ?? 'numbers');
    cellErrors.push(makeError(label, rule,
      VALIDATORS[rule].numberAsTextLabel || VALIDATORS.numbers.numberAsTextLabel,
      details, rows.length, 'warning'));
  }

  // ── Campos obrigatórios por linha ─────────────────────────────────────────
  for (const colName of config.requiredValueColumns ?? []) {
    const colIdx = colMap.get(colName);
    if (colIdx === undefined) continue;
    const details = rows
      .map((row, i) => ({ row: i + 2 + config.skipRows, val: String(row[colIdx] ?? '').trim() }))
      .filter(({ val }) => !val)
      .map(({ row }) => ({ row, value: '(vazio)', colName }));
    if (details.length) cellErrors.push(makeError(colName, 'numbers', REQUIRED_VALUE_LABEL, details, rows.length));
  }

  // ── Limite de caracteres (charLimits) ─────────────────────────────────────
  for (const [colName, limit] of Object.entries(config.charLimits ?? {})) {
    const colIdx = colMap.get(colName);
    if (colIdx === undefined) continue;
    const details = rows.flatMap((row, i) => {
      const val = String(row[colIdx] ?? '').trim();
      if (!val || val.length <= limit) return [];
      return [{ row: i + 2 + config.skipRows, value: val.slice(0, 60) + (val.length > 60 ? '…' : ''), colName }];
    });
    if (details.length) cellErrors.push(makeError(colName, 'text', CHAR_LIMIT_LABEL(limit), details, rows.length));
  }

  // ── Varredura universal: inválidos e invisíveis ───────────────────────────
  for (let ci = 0; ci < headerRow.length; ci++) {
    const colLabel = labelForCol(ci);
    const invalidDetails:   CellErrorDetail[] = [];
    const invisibleDetails: CellErrorDetail[] = [];

    for (let ri = 0; ri < rows.length; ri++) {
      const raw = rows[ri][ci];
      if (typeof raw !== 'string' || raw === '') continue;

      const { invalidChars, invisibleChars } = scanSpecialChars(raw);
      const preview = raw.trim().slice(0, 45) + (raw.trim().length > 45 ? '…' : '');

      if (invalidChars.length > 0) {
        invalidDetails.push({
          row: ri + 2 + config.skipRows,
          value: `${preview}  →  ${invalidChars.join(', ')}`,
          colName: colLabel,
        });
      }

      if (invisibleChars.length > 0) {
        // Marca os caracteres invisíveis inline com seu nome/código
        const marked = markInvisibleChars(raw.trim());
        const markedPreview = marked.length > 80 ? marked.slice(0, 80) + '…' : marked;
        invisibleDetails.push({
          row: ri + 2 + config.skipRows,
          value: markedPreview,
          colName: colLabel,
        });
      }
    }

    if (invalidDetails.length > 0) {
      cellErrors.push(makeError(colLabel, 'text', INVALID_CHAR_LABEL, invalidDetails, rows.length));
    }
    if (invisibleDetails.length > 0) {
      cellErrors.push(makeError(colLabel, 'text', INVISIBLE_CHAR_LABEL, invisibleDetails, rows.length));
    }
  }

  // ── Endereço condicional ──────────────────────────────────────────────────
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
      err.details.push({ row: i + 2 + config.skipRows, value: '(vazio)', colName: addr.name });
    }
  }

  // ── Fornecedor condicional (tipo de fornecedor obrigatório) ───────────────
  // Regra específica de Clientes e Fornecedores: quando "Fornecedor" = 1,
  // pelo menos um dos três tipos (Forn. Produto/Serviço/Transporte) passa a
  // ser obrigatório naquela linha. Mesmo padrão do bloco de endereço acima:
  // uma entrada de erro por coluna faltante, todas com o mesmo ruleLabel, para
  // que o ClientMessageModal agrupe tudo corretamente.
  const fornecedorIdx = colMap.get('Fornecedor');
  const supplierTypeCols = ['Forn. Produto', 'Forn. Serviço', 'Forn. Transporte']
    .map(c => ({ name: c, idx: colMap.get(c) ?? -1 }))
    .filter(t => t.idx !== -1);

  if (fornecedorIdx !== undefined && supplierTypeCols.length > 0) {
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][fornecedorIdx] ?? '').trim() !== '1') continue;

      for (const t of supplierTypeCols) {
        if (String(rows[i][t.idx] ?? '').trim()) continue;
        const key = `${t.name} (tipo de fornecedor)`;
        let err = cellErrors.find(e => e.column === key);
        if (!err) { err = makeError(key, 'binary', SUPPLIER_TYPE_LABEL, [], rows.length); cellErrors.push(err); }
        err.failCount++;
        err.details.push({ row: i + 2 + config.skipRows, value: '(vazio)', colName: t.name });
      }
    }
  }

  const blockingCellErrors = cellErrors.filter(e => e.severity !== 'warning');

  return {
    success: columnErrors.length === 0 && blockingCellErrors.length === 0,
    columnErrors, cellErrors, rowCount: rows.length, ghostRowCount,
  };
}