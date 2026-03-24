import * as XLSX from 'xlsx';
import { FileTypeConfig, VALIDATORS, CellRule } from './validationRules';

export interface ColumnError     { column: string }
export interface CellErrorDetail { row: number; value: string; colName?: string }
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
export const CHAR_LIMIT_LABEL        = (limit: number) => `Texto excede o limite de ${limit} caracteres permitidos`;
export const SPECIAL_CHAR_LABEL      = 'Caractere especial ou inválido encontrado — remova ou substitua pelo equivalente comum';

// ─── Limite máximo de detalhes por erro ──────────────────────────────────────
// Evita arrays gigantes em ficheiros com milhares de linhas com erro.
// O utilizador vê os primeiros 200 — mais do que suficiente para corrigir.
const MAX_DETAILS = 200;

// ─── Whitelist de caracteres permitidos ──────────────────────────────────────
// Regex SEM flag /g para uso com .test() (mais rápido — não precisa de lastIndex reset)
const SPECIAL_CHAR_TEST =
  /[^a-zA-Z0-9 .,\-/()'":;@_#+=!?&%\xC0-\xC3\xC7\xC9\xCA\xCD\xD3-\xD5\xDA\xDC\xE0-\xE3\xE7\xE9\xEA\xED\xF3-\xF5\xFA\xFC]/;

// Regex COM flag /g apenas quando precisamos extrair os caracteres (após o test passar)
const SPECIAL_CHAR_RE =
  /[^a-zA-Z0-9 .,\-/()'":;@_#+=!?&%\xC0-\xC3\xC7\xC9\xCA\xCD\xD3-\xD5\xDA\xDC\xE0-\xE3\xE7\xE9\xEA\xED\xF3-\xF5\xFA\xFC]/g;

const INVISIBLE_CPS = new Set([
  0x00A0, 0x00AD, 0x200B, 0x200C, 0x200D, 0x200E, 0x200F,
  0x2028, 0x2029, 0x202A, 0x202B, 0x202C, 0x202D, 0x202E,
  0x2060, 0xFEFF,
]);

// Regras que produzem APENAS valores numéricos — células dessas colunas
// chegam do Excel como number, nunca como string com char especial.
// Podemos pular a varredura de char especial nessas colunas.
const NUMERIC_ONLY_RULES = new Set<CellRule>(['numbers', 'currency', 'stock', 'binary', 'juros']);

function findSpecialChars(val: string): string[] {
  // Teste rápido primeiro — evita criar array quando não há nada
  if (!SPECIAL_CHAR_TEST.test(val)) return [];
  const found = new Set<string>();
  const matches = val.match(SPECIAL_CHAR_RE);
  if (!matches) return [];
  for (const ch of matches) {
    const cp = ch.codePointAt(0) ?? 0;
    if (INVISIBLE_CPS.has(cp) || cp < 0x20) {
      found.add(`[invisível U+${cp.toString(16).toUpperCase().padStart(4, '0')}]`);
    } else {
      found.add(`"${ch}" (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`);
    }
  }
  return [...found];
}

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

// normalize: ordem correta — NFD PRIMEIRO, depois lowercase, depois strips.
// O Excel pode entregar strings NFC/NFD mistas e espaços especiais (U+00A0, etc.).
// Fazer NFD antes de toLowerCase garante que acentos compostos (ó, ç…) são
// decompostos antes de qualquer comparação.
const normalize = (s: string) =>
  s
    // 1. Strip zero-width, soft-hyphen e caracteres de controle invisíveis
    .replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u034F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFEFF]/g, '')
    // 2. Converter TODOS os tipos de espaço para espaço comum
    //    (non-breaking space U+00A0, thin space, em space, ideographic space, etc.)
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .trim()
    // 3. NFD PRIMEIRO — decompõe acentos antes do toLowerCase
    .normalize('NFD')
    // 4. Strip marcas combinadas (acentos, cedilha U+0327, til, etc.)
    .replace(/[\u0300-\u036f]/g, '')
    // 5. Colapsar espaços e converter para lowercase
    .replace(/\s+/g, ' ')
    .toLowerCase();

const wordKey = (s: string) =>
  normalize(s).replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

const slugKey = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');

// Estratégia 6: token subset — todos os tokens significativos (>2 chars) do
// canonical estão presentes nos tokens do header.
// Ex: "Descrição do produto" → tokens {"descricao","produto"}
//     header "Descricao_do_Produto" → tokens {"descricao","produto"} → MATCH
const tokenSet = (s: string): Set<string> =>
  new Set(normalize(s).replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 2));

const makeError = (column: string, rule: CellRule, ruleLabel: string, details: CellErrorDetail[], totalCount: number): CellError =>
  ({ column, rule, ruleLabel, failCount: details.length, totalCount, details: details.slice(0, MAX_DETAILS) });

const primaryRule = (rule: CellRule | CellRule[]): CellRule =>
  Array.isArray(rule) ? rule[0] : rule;

// ─── Resolução de colunas (6 estratégias) ────────────────────────────────────

function resolveColumnIndices(headerRow: string[], config: FileTypeConfig): Map<string, number> {
  const norm    = headerRow.map(normalize);
  const wkeys   = headerRow.map(wordKey);
  const skeys   = headerRow.map(slugKey);
  const tsets   = headerRow.map(tokenSet);
  const aliases = config.columnAliases ?? {};

  const canonicals = new Set([
    ...config.requiredColumns,
    ...Object.keys(config.cellRules),
    ...(config.addressColumns ?? []),
    ...(config.requiredValueColumns ?? []),
    ...Object.keys(config.charLimits ?? {}),
  ]);

  return new Map(
    [...canonicals].flatMap(canonical => {
      const normC   = normalize(canonical);
      const wkeyC   = wordKey(canonical);
      const skeyC   = slugKey(canonical);
      const tokensC = tokenSet(canonical);
      const aliasC  = aliases[canonical] ?? [];

      let idx = -1;

      // 1. Exacto
      if (idx === -1) idx = headerRow.indexOf(canonical);
      // 2. Normalizado (sem acento, lowercase, espaços colapsados, spaces especiais limpos)
      if (idx === -1) idx = norm.findIndex(h => h === normC);
      // 3. Aliases (também normalizados)
      if (idx === -1) idx = aliasC.reduce<number>((f, a) => f !== -1 ? f : norm.findIndex(h => h === normalize(a)), -1);
      // 4. Palavras ordenadas — ignora pontos, hífens, reordenação
      if (idx === -1) idx = wkeys.findIndex(w => w === wkeyC);
      // 5. Slug alfanumérico — ignora toda pontuação (ex: "isento ie" == "isentoie")
      if (idx === -1) idx = skeys.findIndex(s => s === skeyC);
      // 6. Token subset — todos os tokens do canonical (>2 chars) aparecem no header
      //    Útil para "Descrição do Produto" vs "Descrição do produto" com encoding diferente
      if (idx === -1 && tokensC.size > 0) {
        idx = tsets.findIndex(ts => [...tokensC].every(t => ts.has(t)));
      }

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

    // Para evitar criar objetos desnecessários quando já atingimos o limite
    const rowNum = i + 2 + config.skipRows;
    const detail: CellErrorDetail = { row: rowNum, value: val, colName };

    if (rule === 'date' && typeof raw === 'number') {
      // Converte o serial para string AAAA-MM-DD e valida
      const dateStr = toDateStr(raw);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Serial válido (ex: célula formatada como Data no Excel) — aceita, não é erro
        total++;
        continue;
      }
      // Serial inválido ou não convertível — aí sim é erro
      if (d.dateSerial.length < MAX_DETAILS) d.dateSerial.push({ ...detail, value: dateStr });
      continue;
    }
    if (isLeadingZero)                                     { if (typeof raw === 'number' && d.leadingZero.length < MAX_DETAILS) d.leadingZero.push(detail); continue; }
    if (typeof raw === 'string' && rule !== 'date' && rule !== 'text') { if (d.numberText.length < MAX_DETAILS) d.numberText.push(detail); continue; }

    if (rule === 'stock') {
      const unit = unitColIdx != null ? String(rows[i][unitColIdx] ?? '').trim().toLowerCase() : '';
      const num  = Number(val);
      if (!Number.isFinite(num) || (!KG_ALIASES.has(unit) && !Number.isInteger(num))) {
        if (d.invalid.length < MAX_DETAILS) d.invalid.push(detail);
      }
      continue;
    }

    if (!validator.test(val)) {
      const bucket = rule === 'date' ? d.dateFormat : d.invalid;
      if (bucket.length < MAX_DETAILS) bucket.push(detail);
    }
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

  const colMap   = resolveColumnIndices(headerRow, config);
  const instrErr = detectInstructionRow(rows);
  if (instrErr) return { success: false, columnErrors: [], cellErrors: [instrErr], rowCount: rows.length - 1 };

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
    const errs = validateColumn(colName, primaryRule(rule), colIdx, rows, config, leadingZeroCols.has(colName), unitColIdx);
    for (const e of errs) cellErrors.push(e);
  }

  // ── Varredura universal: número armazenado como texto ─────────────────────
  const checkedForNumText = new Set(
    [...Object.keys(config.cellRules), ...(config.leadingZeroColumns ?? [])]
      .map(n => colMap.get(n)).filter((i): i is number => i !== undefined)
  );

  for (let ci = 0; ci < headerRow.length; ci++) {
    if (checkedForNumText.has(ci)) continue;
    const label   = headerRow[ci] || `Coluna ${ci + 1}`;
    const details: CellErrorDetail[] = [];
    for (let ri = 0; ri < rows.length; ri++) {
      if (details.length >= MAX_DETAILS) break; // ← cap antecipado
      const raw = rows[ri][ci];
      if (typeof raw !== 'string') continue;
      const trimmed = raw.trim();
      if (trimmed && /^-?\d+([.,]\d+)?$/.test(trimmed)) {
        details.push({ row: ri + 2 + config.skipRows, value: trimmed, colName: label });
      }
    }
    if (!details.length) continue;
    const rule = primaryRule((config.cellRules[label] as CellRule | CellRule[] | undefined) ?? 'numbers');
    cellErrors.push(makeError(label, rule,
      VALIDATORS[rule].numberAsTextLabel || VALIDATORS.numbers.numberAsTextLabel,
      details, rows.length));
  }

  // ── Campos obrigatórios por linha ─────────────────────────────────────────
  for (const colName of config.requiredValueColumns ?? []) {
    const colIdx = colMap.get(colName);
    if (colIdx === undefined) continue;
    const details: CellErrorDetail[] = [];
    let total = 0;
    for (let i = 0; i < rows.length; i++) {
      const val = String(rows[i][colIdx] ?? '').trim();
      total++;
      if (!val && details.length < MAX_DETAILS) {
        details.push({ row: i + 2 + config.skipRows, value: '(vazio)', colName });
      }
    }
    if (details.length) cellErrors.push(makeError(colName, 'numbers', REQUIRED_VALUE_LABEL, details, total));
  }

  // ── Limite de caracteres (charLimits) ─────────────────────────────────────
  for (const [colName, limit] of Object.entries(config.charLimits ?? {})) {
    const colIdx = colMap.get(colName);
    if (colIdx === undefined) continue;
    const details: CellErrorDetail[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (details.length >= MAX_DETAILS) break;
      const val = String(rows[i][colIdx] ?? '').trim();
      if (val && val.length > limit) {
        details.push({ row: i + 2 + config.skipRows, value: val.slice(0, 60) + (val.length > 60 ? '…' : ''), colName });
      }
    }
    if (details.length) cellErrors.push(makeError(colName, 'text', CHAR_LIMIT_LABEL(limit), details, rows.length));
  }

  // ── Varredura universal: caracteres especiais em TODAS as colunas ─────────
  // Otimizações:
  // 1. Pula colunas mapeadas como regras puramente numéricas (chegam como number do Excel)
  // 2. Usa SPECIAL_CHAR_TEST (.test) como guarda rápida antes de chamar .match (que cria array)
  // 3. Para de coletar detalhes ao atingir MAX_DETAILS

  // Monta set de índices de colunas com regra numérica — não precisam de scan de char especial
  const numericColIndices = new Set<number>();
  for (const [colName, rule] of Object.entries(config.cellRules)) {
    const colIdx = colMap.get(colName);
    if (colIdx !== undefined && NUMERIC_ONLY_RULES.has(primaryRule(rule))) {
      numericColIndices.add(colIdx);
    }
  }

  for (let ci = 0; ci < headerRow.length; ci++) {
    if (numericColIndices.has(ci)) continue; // ← pula colunas numéricas

    const colLabel = headerRow[ci] || `Coluna ${ci + 1}`;
    const details: CellErrorDetail[] = [];

    for (let ri = 0; ri < rows.length; ri++) {
      if (details.length >= MAX_DETAILS) break; // ← cap antecipado
      const raw = rows[ri][ci];
      if (typeof raw !== 'string' || raw === '') continue;

      // Teste rápido antes de fazer o match completo
      if (!SPECIAL_CHAR_TEST.test(raw)) continue;

      const specials = findSpecialChars(raw);
      if (specials.length === 0) continue;

      const preview = raw.trim().slice(0, 45) + (raw.trim().length > 45 ? '…' : '');
      details.push({
        row: ri + 2 + config.skipRows,
        value: `${preview}  →  ${specials.join(', ')}`,
        colName: colLabel,
      });
    }

    if (details.length > 0) {
      cellErrors.push(makeError(colLabel, 'text', SPECIAL_CHAR_LABEL, details, rows.length));
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
      if (err.failCount < MAX_DETAILS) {
        err.details.push({ row: i + 2 + config.skipRows, value: '(vazio)', colName: addr.name });
      }
      err.failCount++;
    }
  }

  return {
    success: columnErrors.length === 0 && cellErrors.length === 0,
    columnErrors, cellErrors, rowCount: rows.length,
  };
}