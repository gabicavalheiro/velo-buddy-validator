import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Columns3, Grid3X3, ChevronDown, ChevronUp, FileWarning, BarChart3, Hash, HelpCircle, AlertOctagon, Percent, MessageSquare, MapPin } from 'lucide-react';
import type { ValidationResult, CellError } from '@/lib/validateFile';
// linha 5 — remove JUROS_RULE_LABEL do import
import { NUMBER_AS_TEXT_PREFIX, LEADING_ZERO_LABEL, DATE_AS_SERIAL_LABEL, DATE_WRONG_FORMAT_LABEL, INSTRUCTION_ROW_LABEL } from '@/lib/validateFile';import HelpModal from './Helpmodal.tsx';
import ClientMessageModal from './ClientMessagemodal.tsx';

interface Props {
  result: ValidationResult | null;
  fileName: string;
  fileTypeLabel: string;
}

function CellErrorRow({ error, index }: { error: CellError; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const maxPreview = 100;

  const isNumberAsText = error.ruleLabel.startsWith(NUMBER_AS_TEXT_PREFIX);
  const isDateSerial = error.ruleLabel === DATE_AS_SERIAL_LABEL;
  const isDateWrongFormat = error.ruleLabel === DATE_WRONG_FORMAT_LABEL;
// linha 43 — CellErrorRow
const isJurosRule = error.rule === 'juros'; // ← era: error.ruleLabel === JUROS_RULE_LABEL  const isLeadingZero = error.ruleLabel === LEADING_ZERO_LABEL;
  const showHelp = isNumberAsText  || isDateSerial || isDateWrongFormat || isJurosRule;

  return (
    <>
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        columnName={error.column}
        errorType={error.ruleLabel}
        rule={error.rule}
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
            <p className="font-semibold text-foreground text-sm leading-tight truncate">{error.column}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{error.ruleLabel}</p>

            {/* Em mobile: badge + botão ficam abaixo do texto */}
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:hidden">
              <span className="error-badge">{error.failCount} erro{error.failCount > 1 ? 's' : ''}</span>
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

          {/* Em desktop: badge + botão ficam à direita */}
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
            <span className="error-badge">{error.failCount} erro{error.failCount > 1 ? 's' : ''}</span>
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

                {/* Card explicativo da regra de juros */}
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
                      <div
                        className="rounded-lg px-2.5 py-2 mt-1"
                        style={{ background: 'hsl(270 60% 38% / 0.06)', border: '1px solid hsl(270 60% 38% / 0.12)' }}
                      >
                        <p className="text-xs font-semibold text-foreground mb-0.5">Como o sistema calcula:</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          O juros é dividido pelos dias de atraso. Se o juros é <strong>10%</strong> ao mês e há <strong>3 dias</strong> de atraso:
                          <span className="block mt-1 font-mono font-semibold" style={{ color: 'hsl(270 60% 38%)' }}>3 ÷ 10 = 0,33%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs border-b border-border">
                      <th className="text-left py-1.5 pr-4 font-medium">Linha</th>
                      <th className="text-left py-1.5 font-medium">Valor encontrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {error.details.slice(0, maxPreview).map((d, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-1.5 pr-4 font-mono text-xs text-muted-foreground">{d.row}</td>
                        <td className="py-1.5">
                          <code className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive font-mono break-all">
                            {d.value || '(vazio)'}
                          </code>
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
    </>
  );
}

export default function ErrorDashboard({ result, fileName, fileTypeLabel }: Props) {
  const [msgOpen, setMsgOpen] = useState(false);
  if (!result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 sm:py-20">
        <FileWarning className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-base sm:text-lg font-semibold font-heading text-muted-foreground mb-1">Nenhum ficheiro analisado</h3>
        <p className="text-sm text-muted-foreground">Vai à aba "Inserir Ficheiro" para carregar uma planilha.</p>
      </motion.div>
    );
  }

  if (result.success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 sm:py-20">
        <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'hsl(var(--success) / 0.1)' }}>
          <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-success" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold font-heading text-foreground mb-1">Sem erros encontrados!</h3>
        <p className="text-sm text-muted-foreground">O ficheiro <strong className="break-all">{fileName}</strong> passou em todas as validações.</p>
      </motion.div>
    );
  }

  const totalCellErrors = result.cellErrors.reduce((sum, e) => sum + e.failCount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

      {/* Linha de instruções detectada — alerta prioritário */}
      {(() => {
        const instrError = result.cellErrors.find(e => e.ruleLabel === INSTRUCTION_ROW_LABEL);
        if (!instrError) return null;
        return (
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
        );
      })()}


      {/* Endereço incompleto — card explicativo */}
      {result.cellErrors.some(e => e.column.includes('morada')) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden border-2"
          style={{ borderColor: 'hsl(18 90% 52%)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: 'hsl(18 90% 52%)' }}>
            <MapPin className="h-4 w-4 text-white shrink-0" />
            <p className="font-bold text-sm text-white tracking-wide">⚠️ REGRA DE ENDEREÇO — LEIA COM ATENÇÃO</p>
          </div>
          {/* Body */}
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
              Não é permitido preencher apenas alguns.
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary cards */}
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

      {/* Column errors */}
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

      {/* Juros rule explanation card — aparece quando há erros de formato em colunas de Juros/Multa */}
      // ErrorDashboard — card explicativo de juros
      {result.cellErrors.some(e => e.rule === 'juros') && ( // ← era: e.ruleLabel === JUROS_RULE_LABEL
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
            <p>Apenas números com <strong>até 5 caracteres</strong> e <strong>até 2 casas decimais</strong>. Separe os decimais com <strong>vírgula</strong>. Use a formatação <strong>Geral</strong> no Excel.</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">✅ Aceito</p>
                <div className="flex flex-wrap gap-1.5">
                  {['10', '10,5', '10,50', '1,99', '100'].map(v => (
                    <code key={v} className="rounded bg-green-100 text-green-700 px-1.5 py-0.5 text-xs font-mono border border-green-200">{v}</code>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">❌ Rejeitado</p>
                <div className="flex flex-wrap gap-1.5">
                  {['10.5', '10,500', '10,5%', '1000,5'].map(v => (
                    <code key={v} className="rounded bg-red-100 text-red-700 px-1.5 py-0.5 text-xs font-mono border border-red-200">{v}</code>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg p-2.5 mt-1" style={{ background: 'hsl(270 60% 38% / 0.07)', border: '1px solid hsl(270 60% 38% / 0.15)' }}>
              <p className="text-xs" style={{ color: 'hsl(270 60% 32%)' }}>
                💡 <strong>Como o sistema calcula:</strong> o valor é dividido pelos dias de atraso.
                Ex: juros de <strong>10%</strong> ao mês com <strong>3 dias</strong> de atraso → <strong>3 ÷ 10 = 0,33%</strong>.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cell errors */}
      {result.cellErrors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" style={{ color: 'hsl(var(--warning))' }} />
            <h3 className="font-bold font-heading text-foreground text-sm sm:text-base">
              Erros nas células ({totalCellErrors} em {result.cellErrors.length} coluna{result.cellErrors.length > 1 ? 's' : ''})
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Clica em cada item para ver os detalhes:</p>
          <div className="space-y-2">
            {result.cellErrors.map((e, i) => (
              <CellErrorRow key={i} error={e} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Botão gerar mensagem para cliente */}
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