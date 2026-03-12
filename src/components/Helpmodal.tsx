import { motion, AnimatePresence } from 'framer-motion';
import { X, MousePointer2, AlertTriangle, Hash, CheckCircle2, Type } from 'lucide-react';
import { LEADING_ZERO_LABEL, NUMBER_AS_TEXT_LABEL } from '@/lib/validateFile';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  columnName: string;
  errorType: string;
}

const stepsNumberAsText = [
  {
    icon: <MousePointer2 className="h-4 w-4 text-white" />,
    color: 'hsl(270 60% 38%)',
    title: 'Selecione toda a coluna',
    description: (col: string) => <>Clique no cabeçalho da coluna <strong>"{col}"</strong> para selecionar todas as células.</>,
  },
  {
    icon: <AlertTriangle className="h-4 w-4 text-white" />,
    color: 'hsl(280 55% 35%)',
    title: 'Clique no botão de atenção',
    description: () => <>Um ícone <span className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-300">⚠ ▼</span> aparecerá. Clique nele.</>,
  },
  {
    icon: <Hash className="h-4 w-4 text-white" />,
    color: 'hsl(290 50% 32%)',
    title: 'Clique em "Converter para Número"',
    description: () => <>No menu, selecione <strong>"Converter para Número"</strong>. O triângulo verde irá desaparecer.</>,
  },
  {
    icon: <CheckCircle2 className="h-4 w-4 text-white" />,
    color: 'hsl(300 45% 28%)',
    title: 'Formate a coluna como "Geral"',
    description: (col: string) => <>Com <strong>"{col}"</strong> selecionada, vá em <strong>Página Inicial → Número</strong> e escolha <strong>"Geral"</strong>.</>,
  },
];

const stepsLeadingZero = [
  {
    icon: <MousePointer2 className="h-4 w-4 text-white" />,
    color: 'hsl(270 60% 38%)',
    title: 'Selecione toda a coluna',
    description: (col: string) => <>Clique no cabeçalho da coluna <strong>"{col}"</strong>.</>,
  },
  {
    icon: <Type className="h-4 w-4 text-white" />,
    color: 'hsl(280 55% 35%)',
    title: 'Formate como "Texto"',
    description: () => <>Vá em <strong>Página Inicial → Número</strong> e escolha <strong>"Texto"</strong>.</>,
  },
  {
    icon: <Hash className="h-4 w-4 text-white" />,
    color: 'hsl(290 50% 32%)',
    title: 'Redigite os valores',
    description: () => <>Após mudar para "Texto", <strong>apague e redigite</strong> os valores para que os zeros à esquerda sejam preservados.</>,
  },
  {
    icon: <CheckCircle2 className="h-4 w-4 text-white" />,
    color: 'hsl(300 45% 28%)',
    title: 'Verifique os zeros à esquerda',
    description: (col: string) => <>Confirme que <strong>"{col}"</strong> mostra zeros (ex: <code className="bg-muted px-1 rounded text-xs">04652781407</code>). Pronto!</>,
  },
];

export default function HelpModal({ open, onClose, columnName, errorType }: HelpModalProps) {
  const isLeadingZero = errorType === LEADING_ZERO_LABEL;
  const steps = isLeadingZero ? stepsLeadingZero : stepsNumberAsText;

  const title = isLeadingZero ? 'Como corrigir: Zeros à esquerda' : 'Como corrigir: Número como texto';
  const description = isLeadingZero
    ? 'Esta coluna está formatada como número. O Excel vai remover zeros à esquerda (ex: CPF "04652781407" vira "4652781407") na importação.'
    : 'As células têm números salvos como texto (triângulo verde no Excel). Siga os passos:';
  const tip = isLeadingZero
    ? 'CPF, CNPJ, IE e CEST precisam de todos os dígitos. Sempre use "Texto" para essas colunas.'
    : 'Depois de corrigir, salve e valide novamente aqui no Validador Velo.';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Em mobile: sheet vindo de baixo. Em desktop: modal centrado */}
            <div className="w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-card overflow-hidden max-h-[92dvh] flex flex-col">

              {/* Header */}
              <div
                className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0"
                style={{ background: 'hsl(270 60% 38%)' }}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-white font-bold font-heading text-sm sm:text-base leading-tight">{title}</h2>
                    <p className="text-white/70 text-xs mt-0.5 truncate">Coluna: {columnName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 ml-2"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Body — scrollável */}
              <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>

                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow"
                          style={{ background: step.color }}
                        >
                          {i + 1}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="w-px flex-1 bg-border" style={{ minHeight: 10 }} />
                        )}
                      </div>
                      <div className="pb-2 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{step.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {step.description(columnName)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div
                  className="rounded-xl p-3 flex gap-2"
                  style={{ background: 'hsl(270 60% 38% / 0.07)', border: '1px solid hsl(270 60% 38% / 0.15)' }}
                >
                  <span className="text-base leading-none shrink-0">💡</span>
                  <p className="text-xs sm:text-sm" style={{ color: 'hsl(270 60% 32%)' }}>{tip}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex justify-end shrink-0">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'hsl(270 60% 38%)' }}
                >
                  Entendido!
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}