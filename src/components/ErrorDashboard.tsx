import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Columns3, Grid3X3, ChevronDown, ChevronUp, Hash, HelpCircle, AlertOctagon, Percent, MessageSquare, MapPin } from 'lucide-react';
import type { ValidationResult, CellError, CellErrorDetail } from '@/lib/validateFile';
import { NUMBER_AS_TEXT_PREFIX, LEADING_ZERO_LABEL, DATE_AS_SERIAL_LABEL, DATE_WRONG_FORMAT_LABEL, INSTRUCTION_ROW_LABEL } from '@/lib/validateFile';
import type { CellRule } from '@/lib/validationRules';
import HelpModal from './Helpmodal.tsx';
import ClientMessageModal from './ClientMessagemodal.tsx';

interface Props {
  result: ValidationResult | null;
  fileName: string;
  fileTypeLabel: string;
}

// ─── Tipo agrupado ────────────────────────────────────────────────────────────

interface GroupedCellError {
  ruleLabel: string;
  rule: CellRule;
  columns: string[];
  failCount: number;
  details: CellErrorDetail[];
}

function groupCellErrors(errors: CellError[]): GroupedCellError[] {
  const map = new Map<string, GroupedCellError>();

  for (const e of errors) {
    const key = e.ruleLabel;
    if (!map.has(key)) {
      map.set(key, { ruleLabel: e.ruleLabel, rule: e.rule, columns: [], failCount: 0, details: [] });
    }
    const g = map.get(key)!;
    g.columns.push(e.column);
    g.failCount += e.failCount;
    // Injeta o nome da coluna em cada detalhe ao agrupar
    g.details.push(...e.details.map(d => ({ ...d, colName: d.colName ?? e.column })));
  }

  for (const g of map.values()) {
    g.details.sort((a, b) => a.row - b.row);
  }

  return [...map.values()];
}

// ─── Componente de linha agrupada ─────────────────────────────────────────────

function GroupedCellErrorRow({ group, index }: { group: GroupedCellError; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const isNumberAsText  = group.ruleLabel.startsWith(NUMBER_AS_TEXT_PREFIX);
  const isDateSerial    = group.ruleLabel === DATE_AS_SERIAL_LABEL;
  const isDateWrong     = group.ruleLabel === DATE_WRONG_FORMAT_LABEL;
  const isJurosRule     = group.rule === 'juros';
  const isLeadingZero   = group.ruleLabel === LEADING_ZERO_LABEL;
  const showHelp        = isNumberAsText || isDateSerial || isDateWrong || isJurosRule || isLeadingZero;

  const multiColumn = group.columns.length > 1;
  const title = multiColumn
    ? `${group.columns.length} colunas com este erro`
    : group.columns[0];

  return (
    <>
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        columnName={group.columns[0]}
        errorType={group.ruleLabel}
        rule={group.rule}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="rounded-xl bg-card shadow-soft overflow-hidden border border-border"
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-start sm:items-center gap-3 p-3 sm:p-4 text-left hover:bg-muted/40 transition-colors"
        >
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'hsl(var(--warning))' }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight">{title}</p>

            {multiColumn && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {group.columns.map(col => (
                  <span
                    key={col}
                    className="inline-block rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ background: 'hsl(var(--warning) / 0.12)', color: 'hsl(var(--warning))' }}
                  >
                    {col}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{group.ruleLabel}</p>

            <div className="flex flex-wrap items-center gap-2 mt-2 sm:hidden">
              <span className="error-badge">{group.failCount} erro{group.failCount > 1 ? 's' : ''}</span>
              {showHelp && (
                <button
                  onClick={(e) => { e.stopPropagation(); setHelpOpen(true); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: 'hsl(270 60% 38% / 0.1)', color: 'hsl(270 60% 38%)' }}
                >
                  <HelpCircle className="h-3 w-3" />
                  Como corrigir?
                </button>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {showHelp && (
              <button
                onClick={(e) => { e.stopPropagation(); setHelpOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'hsl(270 60% 38% / 0.1)', color: 'hsl(270 60% 38%)' }}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Como corrigir?
              </button>
            )}
            <span className="error-badge">{group.failCount} erro{group.failCount > 1 ? 's' : ''}</span>
          </div>

          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
          }
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-3 sm:px-4 py-3 max-h-64 overflow-y-auto">

                {isJurosRule && (
                  <div
                    className="rounded-xl p-3 mb-3 flex gap-2.5"
                    style={{ background: 'hsl(270 60% 38% / 0.06)', border: '1px solid hsl(270 60% 38% / 0.15)' }}
                  >
                    <Percent className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'hsl(270 60% 38%)' }} />
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: 'hsl(270 60% 32%)' }}>Regra de formatação — Juros / Multa</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5 leading-relaxed">
                        <li>• Até <strong>5 caracteres</strong> no total (ex: <code className="bg-muted px-1 rounded">10,50</code>)</li>
                        <li>• Até <strong>2 casas decimais</strong>, separadas por <strong>vírgula</strong></li>
                        <li>• Formatação da célula: <strong>Geral</strong></li>
                      </ul>
                    </div>
                  </div>
                )}

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs border-b border-border">
                      <th className="text-left py-1.5 pr-4 font-medium w-14">Linha</th>
                      {multiColumn && (
                        <th className="text-left py-1.5 pr-4 font-medium w-36">Coluna</th>
                      )}
                      <th className="text-left py-1.5 font-medium">Valor encontrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.details.map((d, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-1.5 pr-4 text-muted-foreground text-xs">{d.row}</td>
                        {multiColumn && (
                          <td className="py-1.5 pr-4 text-xs font-medium" style={{ color: 'hsl(var(--warning))' }}>
                            {d.colName ?? ''}
                          </td>
                        )}
                        <td className="py-1.5">
                          <code className="text-xs bg-destructive/10 text-destructive rounded px-1.5 py-0.5">{d.value}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ErrorDashboard({ result, fileName, fileTypeLabel }: Props) {
  const [msgOpen, setMsgOpen] = useState(false);

  if (!result) return null;

  if (result.success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-10 text-center gap-3"
      >
        <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
          <XCircle className="h-7 w-7 text-green-500" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold font-heading text-foreground mb-1">Sem erros encontrados!</h3>
        <p className="text-sm text-muted-foreground">O ficheiro <strong className="break-all">{fileName}</strong> passou em todas as validações.</p>
      </motion.div>
    );
  }

  const totalCellErrors  = result.cellErrors.reduce((sum, e) => sum + e.failCount, 0);
  const grouped          = groupCellErrors(
    result.cellErrors.filter(e => e.ruleLabel !== INSTRUCTION_ROW_LABEL && !e.column.includes('morada'))
  );
  const moradaErrors     = result.cellErrors.filter(e => e.column.includes('morada'));
  const instrError       = result.cellErrors.find(e => e.ruleLabel === INSTRUCTION_ROW_LABEL);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

      {instrError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 flex gap-3 border"
          style={{ background: 'hsl(18 90% 52% / 0.08)', borderColor: 'hsl(18 90% 52% / 0.3)' }}
        >
          <AlertOctagon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'hsl(18 90% 52%)' }} />
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground">Linha de instruções detectada</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              A <strong>linha 2</strong> parece conter textos de orientação de preenchimento, não dados reais.
              Apague essa linha inteira antes de importar para que a validação funcione corretamente.
            </p>
            <code className="mt-1.5 block text-xs bg-background rounded px-2 py-1 border border-border text-muted-foreground truncate">
              {instrError.details[0]?.value}
            </code>
          </div>
        </motion.div>
      )}

      {moradaErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden border-2"
          style={{ borderColor: 'hsl(18 90% 52%)' }}
        >
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: 'hsl(18 90% 52%)' }}>
            <MapPin className="h-4 w-4 text-white shrink-0" />
            <p className="font-bold text-sm text-white tracking-wide">⚠️ REGRA DE ENDEREÇO — LEIA COM ATENÇÃO</p>
          </div>
          <div className="px-4 py-3 space-y-3" style={{ background: 'hsl(18 90% 52% / 0.06)' }}>
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              Uma vez que <strong>qualquer campo de endereço</strong> for preenchido,{' '}
              <span style={{ color: 'hsl(18 80% 40%)' }}>TODOS os campos se tornam obrigatórios</span> naquela linha.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {['CEP', 'LOGRADOURO', 'NÚMERO', 'COMPLEMENTO', 'BAIRRO', 'REFERÊNCIA', 'CIDADE', 'ESTADO'].map(field => (
                <div
                  key={field}
                  className="rounded-lg px-2.5 py-1.5 text-center text-xs font-bold"
                  style={{ background: 'hsl(18 90% 52%)', color: 'white' }}
                >
                  {field}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Preencha <strong>todos os campos acima</strong> nas linhas afetadas, ou deixe <strong>todos em branco</strong>.
              Não é permitido preencher apenas alguns.{' '}
              <span className="font-semibold" style={{ color: 'hsl(18 90% 42%)' }}>
                Endereço incompleto faz o Velo salvar os dados como Observação em vez de endereço.
              </span>
            </p>
          </div>
        </motion.div>
      )}

      {result.cellErrors.some(e => e.rule === 'juros') && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'hsl(270 60% 38% / 0.25)', background: 'hsl(270 60% 38% / 0.04)' }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'hsl(270 60% 38% / 0.15)', background: 'hsl(270 60% 38% / 0.08)' }}>
            <Percent className="h-4 w-4 shrink-0" style={{ color: 'hsl(270 60% 38%)' }} />
            <span className="text-sm font-bold font-heading" style={{ color: 'hsl(270 60% 38%)' }}>Regra para Juros e Multa</span>
          </div>
          <div className="px-4 py-3 space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <p>Apenas números com <strong>até 5 caracteres</strong> e <strong>até 2 casas decimais</strong>. Separe os decimais com <strong>vírgula</strong>.</p>
            <p>Exemplos válidos: <code className="bg-muted rounded px-1">10,50</code> · <code className="bg-muted rounded px-1">5</code> · <code className="bg-muted rounded px-1">100,00</code></p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="col-span-2 sm:col-span-1 rounded-xl bg-card border border-border p-3 sm:p-4 shadow-soft">
          <p className="text-xs text-muted-foreground font-medium mb-1">Ficheiro</p>
          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{fileName}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 sm:p-4 shadow-soft">
          <p className="text-xs text-muted-foreground font-medium mb-1">Linhas</p>
          <p className="text-xl sm:text-2xl font-bold font-heading text-foreground">{result.rowCount}</p>
        </div>
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 sm:p-4 shadow-soft">
          <p className="text-xs text-destructive font-medium mb-1">Total de erros</p>
          <p className="text-xl sm:text-2xl font-bold font-heading text-destructive">
            {result.columnErrors.length + totalCellErrors}
          </p>
        </div>
      </div>

      {result.columnErrors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Columns3 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0" />
            <h3 className="font-bold font-heading text-foreground text-sm sm:text-base">Colunas em falta ({result.columnErrors.length})</h3>
          </div>
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 sm:p-4 space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">Estas colunas obrigatórias não foram encontradas:</p>
            <div className="flex flex-wrap gap-2">
              {result.columnErrors.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-1.5 rounded-lg bg-card border border-destructive/20 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-soft"
                >
                  <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-foreground">{e.column}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {grouped.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" style={{ color: 'hsl(var(--warning))' }} />
            <h3 className="font-bold font-heading text-foreground text-sm sm:text-base">
              Erros nas células ({totalCellErrors} em {result.cellErrors.filter(e => e.ruleLabel !== INSTRUCTION_ROW_LABEL && !e.column.includes('morada')).length} coluna{result.cellErrors.length > 1 ? 's' : ''})
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Clica em cada item para ver os detalhes:</p>
          <div className="space-y-2">
            {grouped.map((g, i) => (
              <GroupedCellErrorRow key={i} group={g} index={i} />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-2 pb-1">
        <button
          onClick={() => setMsgOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'hsl(270 60% 38%)' }}
        >
          <MessageSquare className="h-4 w-4" />
          Gerar mensagem para o cliente
        </button>
      </div>

      <ClientMessageModal
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
        result={result}
        fileName={fileName}
        fileTypeLabel={fileTypeLabel}
      />
    </motion.div>
  );
}