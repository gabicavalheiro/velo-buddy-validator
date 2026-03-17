import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import type { CellRule } from '@/lib/validationRules';
import { NUMBER_AS_TEXT_LABEL, LEADING_ZERO_LABEL, DATE_AS_SERIAL_LABEL, DATE_WRONG_FORMAT_LABEL } from '@/lib/validateFile';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  columnName: string;
  errorType: string;
  rule: CellRule;
}

interface FinalFormat {
  name: string;
  path: string;
  example: string;
  note: string;
}

function finalFormat(rule: CellRule): FinalFormat {
  switch (rule) {
    case 'currency':
      return {
        name: 'Moeda',
        path: 'Página Inicial → Número → Moeda',
        example: 'Ex: 1.250,99',
        note: 'O formato Moeda garante que os valores com casas decimais sejam reconhecidos corretamente na importação. Não digite "R$" manualmente.',
      };
    case 'stock':
      return {
        name: 'Número',
        path: 'Página Inicial → Número → Número',
        example: 'Ex: 50 ou -10',
        note: 'Use "Número" com 0 casas decimais. Valores negativos são aceitos para ajuste de estoque.',
      };
    case 'juros':
      return {
        name: 'Geral',
        path: 'Página Inicial → Número → Geral',
        example: 'Ex: 10,50',
        note: 'Com o formato Geral, ao digitar "10,50" o Excel reconhece como número decimal no padrão brasileiro.',
      };
    case 'binary':
      return {
        name: 'Geral',
        path: 'Página Inicial → Número → Geral',
        example: 'Ex: 0 ou 1',
        note: 'Apenas os valores 0 (Não) ou 1 (Sim) são aceitos nesta coluna.',
      };
    case 'numbers':
    default:
      return {
        name: 'Geral',
        path: 'Página Inicial → Número → Geral',
        example: 'Ex: 12345',
        note: 'Apenas números inteiros positivos são aceitos. Não use pontos ou vírgulas.',
      };
  }
}

type StepDesc = (col: string, rule: CellRule) => React.ReactNode;

interface Step {
  color: string;
  title: string | ((col: string, rule: CellRule) => string);
  description: StepDesc;
}

const stepsNumberAsText: Step[] = [
  {
    color: 'hsl(270 60% 38%)',
    title: 'Selecione toda a coluna',
    description: (col) => <>Clique no cabeçalho da coluna <strong>"{col}"</strong> para selecionar todas as células.</>,
  },
  {
    color: 'hsl(280 55% 35%)',
    title: 'Clique no botão de atenção',
    description: () => <>Um ícone <span className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-300">⚠ ▼</span> aparecerá à esquerda da coluna. Clique nele.</>,
  },
  {
    color: 'hsl(290 50% 32%)',
    title: 'Clique em "Converter para Número"',
    description: () => <>No menu suspenso, selecione <strong>"Converter para Número"</strong>. O triângulo verde irá desaparecer.</>,
  },
  {
    color: 'hsl(300 45% 28%)',
    title: (_col: string, rule: CellRule) => `Aplique o formato "${finalFormat(rule).name}"`,
    description: (col, rule) => {
      const fmt = finalFormat(rule);
      return (
        <>
          Com <strong>"{col}"</strong> ainda selecionada, vá em <strong>{fmt.path}</strong> e aplique o formato <strong>"{fmt.name}"</strong>.{' '}
          <span className="text-muted-foreground/70">{fmt.example}</span>
          <span className="block mt-2 rounded-lg px-2.5 py-2 text-xs leading-relaxed"
            style={{ background: 'hsl(270 60% 38% / 0.07)', color: 'hsl(270 50% 30%)' }}>
            💡 {fmt.note}
          </span>
        </>
      );
    },
  },
];


const stepsLeadingZero: Step[] = [
  {
    color: 'hsl(270 60% 38%)',
    title: 'Selecione toda a coluna',
    description: (col) => <>Clique no cabeçalho da coluna <strong>"{col}"</strong> para selecionar todas as células.</>,
  },
  {
    color: 'hsl(280 55% 35%)',
    title: 'Formate como "Texto"',
    description: () => <>Em <strong>Página Inicial → Número</strong>, selecione <strong>"Texto"</strong> no menu de formatação. Faça isso <em>antes</em> de digitar os valores.</>,
  },
  {
    color: 'hsl(290 50% 32%)',
    title: 'Redigite os valores com os zeros',
    description: (col) => <>Agora redigite os valores da coluna <strong>"{col}"</strong> com todos os dígitos, incluindo os zeros à esquerda. Ex: <code className="bg-muted px-1 rounded text-xs">04652781407</code></>,
  },
  {
    color: 'hsl(300 45% 28%)',
    title: 'Confirme que os zeros aparecem',
    description: () => <>Verifique que os zeros à esquerda estão visíveis nas células. Se a coluna estiver como Texto, o Excel não os removerá. Uma seta verde no canto da célula é normal e esperado.</>,
  },
];

const stepsDate: Step[] = [
  {
    color: 'hsl(270 60% 38%)',
    title: 'Selecione toda a coluna',
    description: (col) => <>Clique no cabeçalho da coluna <strong>"{col}"</strong> para selecionar todas as células.</>,
  },
  {
    color: 'hsl(280 55% 35%)',
    title: 'Abra os formatos de número',
    description: () => <>Em <strong>Página Inicial</strong>, clique na seta do campo de formatação e selecione <strong>"Mais Formatos de Número…"</strong> no final da lista.</>,
  },
  {
    color: 'hsl(290 50% 32%)',
    title: 'Mude a localidade para Inglês (EUA)',
    description: () => <>Na janela que abrir, vá em <strong>Número → Data</strong>. No campo <strong>Localidade</strong>, troque de <em>"Português (Brasil)"</em> para <strong>"Inglês (Estados Unidos)"</strong>.</>,
  },
  {
    color: 'hsl(300 45% 28%)',
    title: 'Escolha o formato AAAA-MM-DD e confirme',
    description: () => <>Selecione o padrão <code className="bg-muted px-1 rounded text-xs">YYYY-MM-DD</code> (ex: <code className="bg-muted px-1 rounded text-xs">2024-12-31</code>) e clique em <strong>OK</strong>.</>,
  },
];

const stepsDateWrongFormat: Step[] = [
  {
    color: 'hsl(270 60% 38%)',
    title: 'Selecione toda a coluna',
    description: (col) => <>Clique no cabeçalho da coluna <strong>"{col}"</strong> para selecionar todas as células.</>,
  },
  {
    color: 'hsl(280 55% 35%)',
    title: 'Abra os formatos de número',
    description: () => <>Em <strong>Página Inicial</strong>, clique na seta do campo de formatação e selecione <strong>"Mais Formatos de Número…"</strong>.</>,
  },
  {
    color: 'hsl(290 50% 32%)',
    title: 'Mude a localidade para Inglês (EUA)',
    description: () => <>Na janela, vá em <strong>Número → Data</strong>. No campo <strong>Localidade</strong>, troque de <em>"Português (Brasil)"</em> para <strong>"Inglês (Estados Unidos)"</strong>.</>,
  },
  {
    color: 'hsl(300 45% 28%)',
    title: 'Escolha o formato AAAA-MM-DD e confirme',
    description: () => <>Selecione o padrão <code className="bg-muted px-1 rounded text-xs">YYYY-MM-DD</code> (ex: <code className="bg-muted px-1 rounded text-xs">2024-12-31</code>) e clique em <strong>OK</strong>.</>,
  },
];

interface Config { steps: Step[]; title: string; description: string; tip: string; }

function getConfig(errorType: string, rule: CellRule): Config {
  if (errorType === LEADING_ZERO_LABEL) {
    return {
      steps: stepsLeadingZero,
      title: 'Como corrigir: Zeros à esquerda',
      description: 'Esta coluna está formatada como Número no Excel. Isso faz o Excel remover os zeros à esquerda (ex: CPF "04652781407" vira "4652781407"). A coluna deve estar formatada como Texto. Siga os passos:',
      tip: 'Formate sempre como Texto ANTES de digitar. Se já tiver dados, apague, formate e redigite com os zeros.',
    };
  }
  if (errorType === DATE_AS_SERIAL_LABEL) {
    return {
      steps: stepsDate,
      title: 'Como corrigir: Data em formato errado',
      description: 'A coluna está formatada como Data no Excel. O sistema exige texto no padrão AAAA-MM-DD (ex: 2024-12-31). Siga os passos:',
      tip: 'O formato YYYY-MM-DD com localidade Inglês (EUA) garante que o Excel exporte as datas no padrão exigido pelo Velo.',
    };
  }
  if (errorType === DATE_WRONG_FORMAT_LABEL) {
    return {
      steps: stepsDateWrongFormat,
      title: 'Como corrigir: Formato de data inválido',
      description: 'A data está como texto mas no formato incorreto (ex: 31/12/2020). O sistema exige AAAA-MM-DD. Siga os passos:',
      tip: 'Ao formatar a célula como Texto antes de digitar, o Excel não converterá automaticamente o valor.',
    };
  }
  const fmt = finalFormat(rule);
  return {
    steps: stepsNumberAsText,
    title: 'Como corrigir: Número como texto',
    description: `As células têm números salvos como texto (triângulo verde no Excel). Após converter, a coluna deve ficar no formato "${fmt.name}". Siga os passos:`,
    tip: `Formato final obrigatório: "${fmt.name}" — ${fmt.path}. ${fmt.example}.`,
  };
}

export default function HelpModal({ open, onClose, columnName, errorType, rule }: HelpModalProps) {
  const { steps, title, description, tip } = getConfig(errorType, rule);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <motion.div key="modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-card overflow-hidden max-h-[92dvh] flex flex-col">

              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0" style={{ background: 'hsl(270 60% 38%)' }}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-white font-bold font-heading text-sm sm:text-base leading-tight">{title}</h2>
                    <p className="text-white/70 text-xs mt-0.5 truncate">Coluna: {columnName}</p>
                  </div>
                </div>
                <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 ml-2">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>

                <ol className="space-y-3">
                  {steps.map((step, i) => {
                    const stepTitle = typeof step.title === 'function' ? step.title(columnName, rule) : step.title;
                    return (
                      <li key={i} className="flex gap-3">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow" style={{ background: step.color }}>
                            {i + 1}
                          </div>
                          {i < steps.length - 1 && <div className="w-px flex-1 bg-border" style={{ minHeight: 10 }} />}
                        </div>
                        <div className="pb-2 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{stepTitle}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">{step.description(columnName, rule)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div className="rounded-xl p-3 flex gap-2" style={{ background: 'hsl(270 60% 38% / 0.07)', border: '1px solid hsl(270 60% 38% / 0.15)' }}>
                  <span className="text-base leading-none shrink-0">💡</span>
                  <p className="text-xs sm:text-sm" style={{ color: 'hsl(270 60% 32%)' }}>{tip}</p>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex justify-end shrink-0">
                <button onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: 'hsl(270 60% 38%)' }}>
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