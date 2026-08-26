// src/components/ErrorDashboard.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XCircle, Columns3, Grid3X3, ChevronDown, ChevronUp,
  Hash, HelpCircle, AlertOctagon, MessageSquare, EyeOff, Ban, Rows3, FileDown,
} from 'lucide-react';
import type { ValidationResult, CellError, CellErrorDetail } from '@/lib/validateFile';
import {
  NUMBER_AS_TEXT_PREFIX,
  LEADING_ZERO_LABEL,
  DATE_AS_SERIAL_LABEL,
  DATE_WRONG_FORMAT_LABEL,
  INSTRUCTION_ROW_LABEL,
  INVALID_CHAR_LABEL,
  INVISIBLE_CHAR_LABEL,
} from '@/lib/validateFile';
import type { CellRule } from '@/lib/validationRules';
import HelpModal from './Helpmodal.tsx';
import ClientMessageModal from './ClientMessagemodal.tsx';
import { exportErrorReportPdf } from '@/lib/exportErrorReportPdf.ts';

interface Props {
  result: ValidationResult | null;
  fileName: string;
  fileTypeLabel: string;
}

// ─── Tipo agrupado ────────────────────────────────────────────────────────────

export interface GroupedCellError {
  ruleLabel: string;
  rule: CellRule;
  columns: string[];
  failCount: number;
  details: CellErrorDetail[];
}

export function groupCellErrors(errors: CellError[]): GroupedCellError[] {
  const map = new Map<string, GroupedCellError>();

  for (const e of errors) {
    const key = e.ruleLabel;
    if (!map.has(key)) {
      map.set(key, { ruleLabel: e.ruleLabel, rule: e.rule, columns: [], failCount: 0, details: [] });
    }
    const g = map.get(key)!;
    g.columns.push(e.column);
    g.failCount += e.failCount;
    g.details.push(...e.details.map(d => ({ ...d, colName: d.colName ?? e.column })));
  }

  for (const g of map.values()) {
    g.details.sort((a, b) => a.row - b.row);
  }

  return [...map.values()];
}

// ─── Ícone e cor por tipo de erro ─────────────────────────────────────────────

function getErrorStyle(group: GroupedCellError): {
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  badgeColor: string;
} {
  if (group.ruleLabel === INVALID_CHAR_LABEL) {
    return {
      icon: <Ban className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'hsl(0 72% 51%)' }} />,
      bgColor: 'hsl(0 72% 51% / 0.10)',
      iconColor: 'hsl(0 72% 51%)',
      badgeColor: 'hsl(0 72% 51% / 0.12)',
    };
  }
  if (group.ruleLabel === INVISIBLE_CHAR_LABEL) {
    return {
      icon: <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'hsl(270 60% 38%)' }} />,
      bgColor: 'hsl(270 60% 38% / 0.10)',
      iconColor: 'hsl(270 60% 38%)',
      badgeColor: 'hsl(270 60% 38% / 0.12)',
    };
  }
  // default — warning amarelo
  return {
    icon: <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'hsl(var(--warning))' }} />,
    bgColor: 'hsl(var(--warning) / 0.10)',
    iconColor: 'hsl(var(--warning))',
    badgeColor: 'hsl(var(--warning) / 0.12)',
  };
}

// ─── Componente de linha agrupada ─────────────────────────────────────────────

function GroupedCellErrorRow({ group, index, isWarning }: { group: GroupedCellError; index: number; isWarning?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const isNumberAsText = group.ruleLabel.startsWith(NUMBER_AS_TEXT_PREFIX);
  const isDateSerial   = group.ruleLabel === DATE_AS_SERIAL_LABEL;
  const isDateWrong    = group.ruleLabel === DATE_WRONG_FORMAT_LABEL;
  const isJurosRule    = group.rule === 'juros';
  const isLeadingZero  = group.ruleLabel === LEADING_ZERO_LABEL;
  const showHelp       = isNumberAsText || isDateSerial || isDateWrong || isJurosRule || isLeadingZero;

  const multiColumn = group.columns.length > 1;
  const title = multiColumn ? `${group.columns.length} colunas com este erro` : group.columns[0];

  const { icon, bgColor, iconColor, badgeColor } = getErrorStyle(group);
  const countLabel = isWarning ? 'aviso' : 'erro';

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
          <div
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"
            style={{ background: bgColor }}
          >
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight">{title}</p>

            {multiColumn && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {group.columns.map(col => (
                  <span
                    key={col}
                    className="inline-block rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ background: badgeColor, color: iconColor }}
                  >
                    {col}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{group.ruleLabel}</p>

            <div className="flex flex-wrap items-center gap-2 mt-2 sm:hidden">
              <span className={isWarning ? 'warning-badge' : 'error-badge'}>
                {group.failCount} {countLabel}{group.failCount > 1 ? 's' : ''}
              </span>
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
            <span className={isWarning ? 'warning-badge' : 'error-badge'}>
              {group.failCount} {countLabel}{group.failCount > 1 ? 's' : ''}
            </span>
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>

          <div className="sm:hidden shrink-0 mt-0.5">
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-3 sm:px-4 py-3 max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs border-b border-border">
                      <th className="text-left py-1.5 pr-4 font-medium w-16">Linha</th>
                      {multiColumn && (
                        <th className="text-left py-1.5 pr-4 font-medium w-32">Coluna</th>
                      )}
                      <th className="text-left py-1.5 font-medium">Valor encontrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.details.map((d, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-1.5 pr-4 text-xs text-muted-foreground font-mono">{d.row}</td>
                        {multiColumn && (
                          <td className="py-1.5 pr-4 text-xs text-muted-foreground truncate max-w-[8rem]">
                            {d.colName ?? ''}
                          </td>
                        )}
                        <td className="py-1.5">
                          <code className={`text-xs rounded px-1.5 py-0.5 ${isWarning ? 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]' : 'bg-destructive/10 text-destructive'}`}>
                            {d.value}
                          </code>
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

  // Erros de célula "relevantes" para exibição — exclui a detecção de linha de
  // instruções e os erros de morada, que já têm banners próprios abaixo.
  const relevantCellErrors = result.cellErrors.filter(
    e => e.ruleLabel !== INSTRUCTION_ROW_LABEL && !e.column.includes('morada')
  );

  // Separação por severidade: 'warning' é só um alerta informativo (ex: coluna
  // numérica que PODERIA perder um zero à esquerda) — não bloqueia a
  // importação e por isso é mostrado numa seção própria, sempre visível,
  // mesmo quando não há nenhum erro bloqueante (result.success === true).
  const blockingCellErrors = relevantCellErrors.filter(e => e.severity !== 'warning');
  const warningCellErrors  = relevantCellErrors.filter(e => e.severity === 'warning');

  const totalBlockingCellErrors = blockingCellErrors.reduce((sum, e) => sum + e.failCount, 0);
  const totalWarnings           = warningCellErrors.reduce((sum, e) => sum + e.failCount, 0);

  const groupedErrors   = groupCellErrors(blockingCellErrors);
  const groupedWarnings = groupCellErrors(warningCellErrors);

  const moradaErrors = result.cellErrors.filter(e => e.column.includes('morada'));
  const instrError   = result.cellErrors.find(e => e.ruleLabel === INSTRUCTION_ROW_LABEL);

  const ghostRowBanner = result.ghostRowCount > 0 && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex gap-3 border"
      style={{ background: 'hsl(210 80% 50% / 0.08)', borderColor: 'hsl(210 80% 50% / 0.3)' }}
    >
      <Rows3 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'hsl(210 80% 45%)' }} />
      <div className="min-w-0">
        <p className="font-bold text-sm text-foreground">
          {result.ghostRowCount} linha{result.ghostRowCount > 1 ? 's' : ''} vazia{result.ghostRowCount > 1 ? 's' : ''} "fantasma" no final da planilha (ignorada{result.ghostRowCount > 1 ? 's' : ''} na validação)
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          O Excel às vezes registra a planilha como tendo mais linhas do que os dados reais — geralmente por formatação
          (cor, borda, formato de número) aplicada numa faixa vazia abaixo da última linha preenchida.
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          <strong className="text-foreground">Para corrigir na origem:</strong> selecione as linhas abaixo da última com dado real,
          clique com o botão direito e escolha <strong className="text-foreground">"Excluir linhas"</strong> (não apenas "Limpar conteúdo"),
          depois salve. Alguns sistemas de importação leem a dimensão bruta do arquivo e podem processar essas linhas vazias mesmo assim.
        </p>
      </div>
    </motion.div>
  );

  const warningsSection = groupedWarnings.length > 0 && (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" style={{ color: 'hsl(var(--warning))' }} />
        <h3 className="font-bold font-heading text-foreground text-sm sm:text-base">
          Avisos ({totalWarnings} em {groupedWarnings.length} coluna{groupedWarnings.length > 1 ? 's' : ''})
        </h3>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Não impedem a importação — apenas um alerta preventivo. Clica em cada item para ver os detalhes:
      </p>
      <div className="space-y-2">
        {groupedWarnings.map((g, i) => (
          <GroupedCellErrorRow key={i} group={g} index={i} isWarning />
        ))}
      </div>
    </div>
  );

  // ── Estado "sem erros bloqueantes" ────────────────────────────────────────
  // Mesmo quando não há nenhum erro que impeça a importação, ainda mostramos
  // os avisos (se houver), em vez de escondê-los atrás da tela de sucesso.
  if (result.success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        {ghostRowBanner}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-8 sm:py-10 text-center gap-3"
        >
          <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
            <XCircle className="h-7 w-7 text-green-500" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold font-heading text-foreground mb-1">
            {groupedWarnings.length > 0 ? 'Sem erros bloqueantes!' : 'Sem erros encontrados!'}
          </h3>
          <p className="text-sm text-muted-foreground">
            O ficheiro <strong className="break-all">{fileName}</strong> passou em todas as validações
            {groupedWarnings.length > 0 ? ' — veja os avisos abaixo:' : '.'}
          </p>
        </motion.div>

        {warningsSection}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

      {ghostRowBanner}

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
          </div>
        </motion.div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-card border border-border p-3 sm:p-4 shadow-soft text-center">
          <p className="text-xs text-muted-foreground font-medium mb-1">Ficheiro</p>
          <p className="text-xs font-bold text-foreground truncate" title={fileName}>{fileName}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 sm:p-4 shadow-soft text-center">
          <p className="text-xs text-muted-foreground font-medium mb-1">Linhas</p>
          <p className="text-xl sm:text-2xl font-bold font-heading text-foreground">{result.rowCount}</p>
        </div>
        <div className="rounded-xl border p-3 sm:p-4 shadow-soft text-center" style={{ background: 'hsl(var(--destructive) / 0.05)', borderColor: 'hsl(var(--destructive) / 0.2)' }}>
          <p className="text-xs text-destructive font-medium mb-1">Total de erros</p>
          <p className="text-xl sm:text-2xl font-bold font-heading text-destructive">
            {result.columnErrors.length + totalBlockingCellErrors}
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

      {moradaErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 flex gap-3 border"
          style={{ background: 'hsl(18 90% 52% / 0.08)', borderColor: 'hsl(18 90% 52% / 0.3)' }}
        >
          <AlertOctagon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'hsl(18 90% 52%)' }} />
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground">Regra de endereço — campos incompletos</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Quando qualquer campo de endereço é preenchido, <strong>todos</strong> são obrigatórios:
              CEP, Logradouro, Número, Complemento, Bairro, Referência, Cidade e Estado.
              Preencha todos ou deixe todos em branco.
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {moradaErrors.map((e, i) => (
                <span key={i} className="inline-block rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{ background: 'hsl(18 90% 52% / 0.12)', color: 'hsl(18 90% 52%)' }}>
                  {e.column.replace(' (morada incompleta)', '')}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {groupedErrors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" style={{ color: 'hsl(var(--warning))' }} />
            <h3 className="font-bold font-heading text-foreground text-sm sm:text-base">
              Erros nas células ({totalBlockingCellErrors} em {groupedErrors.length} coluna{groupedErrors.length > 1 ? 's' : ''})
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Clica em cada item para ver os detalhes:</p>
          <div className="space-y-2">
            {groupedErrors.map((g, i) => (
              <GroupedCellErrorRow key={i} group={g} index={i} />
            ))}
          </div>
        </div>
      )}

      {warningsSection}

      <div className="flex flex-wrap justify-center gap-2 pt-2 pb-1">
        <button
          onClick={() => setMsgOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'hsl(270 60% 38%)' }}
        >
          <MessageSquare className="h-4 w-4" />
          Gerar mensagem para o cliente
        </button>
        <button
          onClick={() => exportErrorReportPdf(result, fileName, fileTypeLabel)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted/40 transition-colors"
        >
          <FileDown className="h-4 w-4" />
          Exportar relatório em PDF
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