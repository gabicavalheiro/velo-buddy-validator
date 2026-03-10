import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle, Columns3, Grid3X3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ValidationResult } from '@/lib/validateFile';

interface Props {
  result: ValidationResult;
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
          <p className="text-sm text-muted-foreground">Algumas células não seguem o formato esperado:</p>
          <div className="space-y-2">
            {result.cellErrors.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 rounded-xl bg-card p-3 shadow-soft"
              >
                <span className="font-semibold text-foreground">{e.column}</span>
                <span className="text-xs text-muted-foreground">Formato: {e.ruleLabel}</span>
                <span className="error-badge ml-auto">
                  {e.failCount} célula{e.failCount > 1 ? 's' : ''} com erro
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
