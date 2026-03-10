import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle, Columns3, Grid3X3, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ValidationResult, CellError } from '@/lib/validateFile';

interface Props {
  result: ValidationResult;
}

function CellErrorCard({ error }: { error: CellError }) {
  const [expanded, setExpanded] = useState(false);
  const maxPreview = 50;
  const hasMore = error.details.length > maxPreview;

  return (
    <div className="rounded-xl bg-card shadow-soft overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-foreground">{error.column}</span>
        <span className="text-xs text-muted-foreground">Formato: {error.ruleLabel}</span>
        <span className="error-badge sm:ml-auto shrink-0">
          {error.failCount} célula{error.failCount > 1 ? 's' : ''} com erro
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
            <div className="border-t border-border px-3 py-2 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="text-left py-1.5 pr-4 font-medium">Linha</th>
                    <th className="text-left py-1.5 font-medium">Valor encontrado</th>
                  </tr>
                </thead>
                <tbody>
                  {error.details.slice(0, expanded ? maxPreview : 5).map((d, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-1.5 pr-4 font-mono text-xs text-muted-foreground">{d.row}</td>
                      <td className="py-1.5">
                        <code className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive font-mono">
                          {d.value}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  A mostrar {maxPreview} de {error.details.length} erros
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ValidationResults({ result }: Props) {
  useEffect(() => {
    if (result.success) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#34d399', '#fbbf24', '#60a5fa', '#f472b6'],
      });
    }
  }, [result.success]);

  if (result.success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 text-center shadow-card"
        style={{ background: 'hsl(var(--success) / 0.08)' }}
      >
        <CheckCircle2 className="mx-auto h-16 w-16 text-success mb-4" />
        <h2 className="text-2xl font-bold font-heading text-foreground mb-2">Tudo perfeito! 🎉</h2>
        <p className="text-muted-foreground text-lg">
          As colunas e as células têm a formatação exata.<br />
          Podes importar sem medo!
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{result.rowCount} linhas analisadas</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 text-destructive">
        <AlertTriangle className="h-6 w-6" />
        <h2 className="text-xl font-bold font-heading">Encontrámos alguns problemas</h2>
      </div>
      <p className="text-sm text-muted-foreground">{result.rowCount} linhas analisadas</p>

      {result.columnErrors.length > 0 && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <Columns3 className="h-5 w-5" />
            Erros nas Colunas
          </div>
          <p className="text-sm text-muted-foreground">As seguintes colunas obrigatórias não foram encontradas:</p>
          <ul className="space-y-2">
            {result.columnErrors.map((e, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                <span className="error-badge">{e.column}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {result.cellErrors.length > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold" style={{ color: 'hsl(var(--warning))' }}>
            <Grid3X3 className="h-5 w-5" />
            Erros nas Células
          </div>
          <p className="text-sm text-muted-foreground">Clica em cada erro para ver os detalhes (linha e valor):</p>
          <div className="space-y-2">
            {result.cellErrors.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <CellErrorCard error={e} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
