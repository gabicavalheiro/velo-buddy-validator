import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  XCircle,
  Columns3,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  FileWarning,
  BarChart3,
  Hash,
  MapPin,
} from 'lucide-react';
import type { ValidationResult, CellError, CellWarning } from '@/lib/validateFile';

interface Props {
  result: ValidationResult | null;
  fileName: string;
}

// ─── Linha de erro de célula (expansível) ─────────────────────────────────────

function CellErrorRow({ error, index }: { error: CellError; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const maxPreview = 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-xl bg-card shadow-soft overflow-hidden border border-border"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
          <Hash className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{error.column}</p>
          <p className="text-xs text-muted-foreground">Formato esperado: {error.ruleLabel}</p>
        </div>
        <span className="error-badge shrink-0">
          {error.failCount} erro{error.failCount > 1 ? 's' : ''}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
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
            <div className="border-t border-border px-4 py-3 max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-6 font-medium w-24">Linha no ficheiro</th>
                    <th className="text-left py-2 pr-4 font-medium">Valor encontrado</th>
                    <th className="text-left py-2 font-medium">Problema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {error.details.slice(0, maxPreview).map((d, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-6">
                        <span className="inline-flex items-center justify-center h-6 min-w-[2.5rem] rounded-md bg-muted text-xs font-mono font-medium text-muted-foreground">
                          {d.row}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <code className="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive font-mono break-all">
                          {d.value || '(vazio)'}
                        </code>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        Não corresponde a "{error.ruleLabel}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {error.details.length > maxPreview && (
                <p className="text-xs text-muted-foreground text-center py-2 border-t border-border mt-2">
                  A mostrar {maxPreview} de {error.details.length} erros
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Linha de alerta (expansível) ─────────────────────────────────────────────

function CellWarningRow({ warning, index }: { warning: CellWarning; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const maxPreview = 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-xl overflow-hidden border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-yellow-100/60 dark:hover:bg-yellow-900/20 transition-colors"
      >
        <div className="h-9 w-9 rounded-lg bg-yellow-200/60 dark:bg-yellow-800/30 flex items-center justify-center shrink-0">
          <MapPin className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-yellow-900 dark:text-yellow-200 text-sm truncate">{warning.column}</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">{warning.warningLabel}</p>
        </div>
        <span className="shrink-0 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-bold px-2.5 py-0.5">
          {warning.failCount} linha{warning.failCount !== 1 ? 's' : ''}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-yellow-600 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-yellow-600 shrink-0" />
        )}
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
            <div className="border-t border-yellow-200 dark:border-yellow-800 px-4 py-3 max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-yellow-700 dark:text-yellow-400 text-xs">
                    <th className="text-left py-2 pr-6 font-medium w-24">Linha no ficheiro</th>
                    <th className="text-left py-2 font-medium">Valor encontrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-100 dark:divide-yellow-900/40">
                  {warning.details.slice(0, maxPreview).map((d, i) => (
                    <tr key={i} className="hover:bg-yellow-100/60 dark:hover:bg-yellow-900/20 transition-colors">
                      <td className="py-2 pr-6">
                        <span className="inline-flex items-center justify-center h-6 min-w-[2.5rem] rounded-md bg-yellow-200/60 dark:bg-yellow-800/30 text-xs font-mono font-medium text-yellow-800 dark:text-yellow-300">
                          {d.row}
                        </span>
                      </td>
                      <td className="py-2">
                        <code className="rounded bg-yellow-200/60 dark:bg-yellow-800/30 px-2 py-0.5 text-xs text-yellow-800 dark:text-yellow-300 font-mono">
                          {d.value || '(vazio)'}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {warning.details.length > maxPreview && (
                <p className="text-xs text-yellow-700 dark:text-yellow-400 text-center py-2 border-t border-yellow-200 dark:border-yellow-800 mt-2">
                  A mostrar {maxPreview} de {warning.details.length} linhas
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export default function ErrorDashboard({ result, fileName }: Props) {
  if (!result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
        <FileWarning className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold font-heading text-muted-foreground mb-1">Nenhum ficheiro analisado</h3>
        <p className="text-sm text-muted-foreground">Vai à aba "Inserir Ficheiro" para carregar uma planilha.</p>
      </motion.div>
    );
  }

  if (result.success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
        <div
          className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'hsl(var(--success) / 0.1)' }}
        >
          <BarChart3 className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold font-heading text-foreground mb-1">Sem erros encontrados!</h3>
        <p className="text-sm text-muted-foreground">
          O ficheiro <strong>{fileName}</strong> passou em todas as validações.
        </p>

        {/* Mesmo em sucesso, exibe alertas de endereço se existirem */}
        {result.cellWarnings && result.cellWarnings.length > 0 && (
          <div className="mt-8 text-left">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="font-bold font-heading text-foreground">
                Alertas ({result.cellWarnings.length}) — Não bloqueiam a importação
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Estes campos de endereço estão incompletos. O sistema importará os dados disponíveis para o campo Observações.
            </p>
            <div className="space-y-2">
              {result.cellWarnings.map((w, i) => (
                <CellWarningRow key={i} warning={w} index={i} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  const totalCellErrors = result.cellErrors.reduce((sum, e) => sum + e.failCount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-card border border-border p-4 shadow-soft">
          <p className="text-xs text-muted-foreground font-medium mb-1">Ficheiro</p>
          <p className="text-sm font-semibold text-foreground truncate">{fileName}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 shadow-soft">
          <p className="text-xs text-muted-foreground font-medium mb-1">Linhas analisadas</p>
          <p className="text-2xl font-bold font-heading text-foreground">{result.rowCount}</p>
        </div>
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 shadow-soft">
          <p className="text-xs text-destructive font-medium mb-1">Total de erros</p>
          <p className="text-2xl font-bold font-heading text-destructive">
            {result.columnErrors.length + totalCellErrors}
          </p>
        </div>
      </div>

      {/* Colunas em falta */}
      {result.columnErrors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Columns3 className="h-5 w-5 text-destructive" />
            <h3 className="font-bold font-heading text-foreground">
              Colunas em falta ({result.columnErrors.length})
            </h3>
          </div>
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Estas colunas obrigatórias não foram encontradas no ficheiro:
            </p>
            <div className="flex flex-wrap gap-2">
              {result.columnErrors.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-1.5 rounded-lg bg-card border border-destructive/20 px-3 py-2 shadow-soft"
                >
                  <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-sm font-medium text-foreground">{e.column}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Erros de célula */}
      {result.cellErrors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" style={{ color: 'hsl(var(--warning))' }} />
            <h3 className="font-bold font-heading text-foreground">
              Erros nas células ({totalCellErrors} erros em {result.cellErrors.length} coluna{result.cellErrors.length > 1 ? 's' : ''})
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">Clica em cada item para ver exatamente onde está o erro:</p>
          <div className="space-y-2">
            {result.cellErrors.map((e, i) => (
              <CellErrorRow key={i} error={e} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Alertas de endereço — não bloqueiam a importação */}
      {result.cellWarnings && result.cellWarnings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h3 className="font-bold font-heading text-foreground">
              Alertas ({result.cellWarnings.length}) — Não bloqueiam a importação
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Campos de endereço incompletos. O sistema importará os dados disponíveis para o campo Observações.
          </p>
          <div className="space-y-2">
            {result.cellWarnings.map((w, i) => (
              <CellWarningRow key={i} warning={w} index={i} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}