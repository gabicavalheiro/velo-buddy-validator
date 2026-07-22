// src/components/ClientMessageModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, MessageSquare } from 'lucide-react';
import type { CellRule } from '@/lib/validationRules';
import type { ValidationResult, CellError } from '@/lib/validateFile';

import {
  NUMBER_AS_TEXT_PREFIX,
  LEADING_ZERO_LABEL,
  DATE_AS_SERIAL_LABEL,
  DATE_WRONG_FORMAT_LABEL,
  INSTRUCTION_ROW_LABEL,
  REQUIRED_VALUE_LABEL,
  INVALID_CHAR_LABEL,
  INVISIBLE_CHAR_LABEL,
} from '@/lib/validateFile';

interface Props {
  open: boolean;
  onClose: () => void;
  result: ValidationResult;
  fileName: string;
  fileTypeLabel: string;
}

function finalFormatLabel(rule: CellRule): string {
  switch (rule) {
    case 'currency':     return 'Moeda (decimais com vírgula, sem R$)';
    case 'currency_dot': return 'Moeda (decimais com ponto, sem R$)';
    case 'juros':        return 'Geral';
    case 'stock':        return 'Número (inteiro, pode ser negativo)';
    case 'numbers':
    case 'binary':
    default:             return 'Geral';
  }
}

function finalFormatPath(rule: CellRule): string {
  switch (rule) {
    case 'currency':
    case 'currency_dot': return 'Página Inicial → Número → Moeda';
    default:             return 'Página Inicial → Número → Geral';
  }
}

function groupErrors(cellErrors: CellError[]): Map<string, { rule: CellRule; cols: string[] }> {
  const map = new Map<string, { rule: CellRule; cols: string[] }>();
  for (const e of cellErrors) {
    if (e.ruleLabel === INSTRUCTION_ROW_LABEL) continue;
    const key = `${e.ruleLabel}||${e.rule}`;
    if (!map.has(key)) map.set(key, { rule: e.rule, cols: [] });
    map.get(key)!.cols.push(e.column);
  }
  return map;
}

function buildMessage(result: ValidationResult, fileName: string, fileTypeLabel: string): string {
  const lines: string[] = [];

  lines.push('Olá! 😊');
  lines.push('');
  lines.push(`Planilha *${fileName}* (${fileTypeLabel}) — encontramos os seguintes pontos para corrigir:`);
  lines.push('');

  const instrError = result.cellErrors.find(e => e.ruleLabel === INSTRUCTION_ROW_LABEL);
  if (instrError) {
    lines.push('⚠️ *Linha de instruções detectada*');
    lines.push('A linha 2 parece conter textos de orientação, não dados reais. Por favor, apague essa linha inteira antes de importar.');
    lines.push('');
  }

  if (result.columnErrors.length > 0) {
    lines.push('📋 *Colunas obrigatórias em falta*');
    result.columnErrors.forEach(e => lines.push(`  • ${e.column}`));
    lines.push('Por favor, adicione essas colunas e preencha os dados correspondentes.');
    lines.push('');
  }

  for (const [key, { rule, cols }] of groupErrors(result.cellErrors)) {
    const ruleLabel = key.split('||')[0];
    const colList   = cols.map(c => `*${c}*`).join(', ');

    if (ruleLabel.startsWith(NUMBER_AS_TEXT_PREFIX)) {
      const fmt  = finalFormatLabel(rule);
      const path = finalFormatPath(rule);
      lines.push('🔢 *Número armazenado como texto*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('Os valores estão salvos como texto no Excel (triângulo verde no canto da célula). Para corrigir:');
      lines.push('  1. Selecione a(s) coluna(s) indicada(s)');
      lines.push('  2. Clique no ícone ⚠️ que aparece à esquerda');
      lines.push('  3. Escolha *"Converter para Número"*');
      lines.push(`  4. Com a coluna ainda selecionada, vá em *${path}* e aplique o formato *"${fmt}"*`);
      lines.push('');

    } else if (ruleLabel === LEADING_ZERO_LABEL) {
      lines.push('🔤 *Zeros à esquerda em risco — formate como Texto*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('Essa(s) coluna(s) está(ão) formatada(s) como número no Excel, o que remove automaticamente os zeros à esquerda (ex: CPF "04652781407" vira "4652781407"). Para corrigir:');
      lines.push('  1. Selecione a(s) coluna(s)');
      lines.push('  2. Vá em *Página Inicial → Número → Texto*');
      lines.push('  3. Redigite os valores com todos os dígitos, incluindo os zeros à esquerda');
      lines.push('  ⚠️ O formato Texto deve ser aplicado *antes* de digitar os valores.');
      lines.push('');

    } else if (ruleLabel === DATE_AS_SERIAL_LABEL) {
      lines.push('📅 *Data em formato de data do Excel*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('As datas precisam estar no formato *AAAA-MM-DD* (ex: 2024-12-31). Para corrigir:');
      lines.push('  1. Selecione a(s) coluna(s)');
      lines.push('  2. Vá em *Página Inicial → Mais Formatos de Número*');
      lines.push('  3. Em "Número → Data", mude a localidade para *Inglês (Estados Unidos)*');
      lines.push('  4. Escolha o formato *YYYY-MM-DD* e clique OK');
      lines.push('');

    } else if (ruleLabel === DATE_WRONG_FORMAT_LABEL) {
      lines.push('📅 *Formato de data incorreto*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('As datas estão num formato inválido (ex: 31/12/2024). O padrão exigido é *AAAA-MM-DD* (ex: 2024-12-31). Corrija seguindo os mesmos passos acima.');
      lines.push('');

    } else if (rule === 'juros') {
      lines.push('📊 *Formato de Juros/Multa incorreto*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('Os valores devem ter no máximo 3 dígitos inteiros e 2 casas decimais separadas por *vírgula* (ex: 10,50). A célula deve estar no formato *Geral* no Excel.');
      lines.push('');

    } else if (rule === 'currency_dot') {
      lines.push('💰 *Formato de valor incorreto — Contas a Receber*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('Nesta planilha, os valores devem usar *ponto* como separador decimal (ex: 1250.99). Não use vírgula nem o símbolo "R$".');
      lines.push('Aplique o formato *Moeda* no Excel: *Página Inicial → Número → Moeda*.');
      lines.push('');

    } else if (rule === 'currency') {
      lines.push('💰 *Formato de valor incorreto*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('Os valores devem usar *vírgula* como separador decimal (ex: 1250,99). Não use o símbolo "R$".');
      lines.push('Aplique o formato *Moeda* no Excel: *Página Inicial → Número → Moeda*.');
      lines.push('');

    } else if (ruleLabel === INVALID_CHAR_LABEL) {
      lines.push('🔡 *Caractere inválido encontrado*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('Existem caracteres não permitidos pelo sistema (ex: aspas tipográficas "  ", travessão —, símbolo ©). Para corrigir:');
      lines.push('  1. Localize as linhas indicadas no relatório');
      lines.push('  2. Substitua os caracteres especiais pelas versões simples (ex: aspas retas " ", hífen -)');
      lines.push('  ⚠️ Evite copiar texto diretamente do Word ou de páginas web, pois eles inserem esses caracteres automaticamente.');
      lines.push('');

    } else if (ruleLabel === INVISIBLE_CHAR_LABEL) {
      lines.push('👻 *Caractere invisível encontrado*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('Existem caracteres invisíveis nas células (ex: espaço não-separável, zero-width space). Eles não aparecem na tela mas causam erros na importação. Para corrigir:');
      lines.push('  1. Localize as linhas indicadas no relatório');
      lines.push('  2. Clique na célula, selecione todo o conteúdo (Ctrl+A) e redigite o valor manualmente');
      lines.push('  ⚠️ Esses caracteres costumam vir de cópias de sites, PDFs ou sistemas externos.');
      lines.push('');

    } else if (ruleLabel === REQUIRED_VALUE_LABEL) {
      lines.push('🔴 *Campo obrigatório vazio*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push('Existem linhas sem preenchimento nessa(s) coluna(s) obrigatória(s). Por favor, preencha todos os campos.');
      lines.push('');

    } else if (ruleLabel.toLowerCase().includes('morada')) {
      lines.push('🏠 *REGRA DE ENDEREÇO — ATENÇÃO*');
      lines.push('');
      lines.push('Não é permitido preencher apenas alguns campos de endereço.');
      lines.push('⚠️ *Atenção:* endereço incompleto faz o Velo salvar os dados como Observação em vez de endereço.');
      lines.push('');
      lines.push('👉 *CEP* | *LOGRADOURO* | *NÚMERO* | *COMPLEMENTO* | *BAIRRO* | *REFERÊNCIA* | *CIDADE* | *ESTADO*');
      lines.push('');
      lines.push(`Nas linhas com erro (campo(s) vazio(s): ${colList}), preencha *todos* os campos acima ou deixe *todos* em branco.`);
      lines.push('');

    } else if (ruleLabel.startsWith('Texto excede o limite de')) {
      lines.push('📏 *Valor excede o tamanho do campo*');
      lines.push(`Coluna(s): ${colList}`);
      lines.push(`${ruleLabel}. Reduza o texto nas células indicadas.`);
      lines.push('');

    } else {
      const fmt = finalFormatLabel(rule);
      lines.push(`❌ *Valor inválido — ${fmt}*`);
      lines.push(`Coluna(s): ${colList}`);
      lines.push(`Verifique os valores e aplique o formato correto: *${finalFormatPath(rule)}*.`);
      lines.push('');
    }
  }

  lines.push('Após realizar as correções, basta enviar a planilha novamente para validação. 🙏');
  lines.push('Qualquer dúvida, estamos à disposição!');

  return lines.join('\n');
}

export default function ClientMessageModal({ open, onClose, result, fileName, fileTypeLabel }: Props) {
  const [copied, setCopied] = useState(false);
  const message = buildMessage(result, fileName, fileTypeLabel);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
            <div className="w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-card overflow-hidden max-h-[92dvh] flex flex-col">

              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0" style={{ background: 'hsl(270 60% 38%)' }}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold font-heading text-sm sm:text-base leading-tight">Mensagem para o cliente</h2>
                    <p className="text-white/65 text-xs mt-0.5">Pronta para copiar e enviar</p>
                  </div>
                </div>
                <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                <pre
                  className="whitespace-pre-wrap text-xs sm:text-sm text-foreground leading-relaxed font-sans rounded-xl p-4 border border-border"
                  style={{ background: 'hsl(220 20% 97%)' }}
                >
                  {message}
                </pre>
              </div>

              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex gap-2 shrink-0">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-muted/40 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: copied ? 'hsl(145 55% 38%)' : 'hsl(270 60% 38%)' }}
                >
                  {copied
                    ? <><Check className="h-4 w-4" /> Copiado!</>
                    : <><Copy className="h-4 w-4" /> Copiar mensagem</>
                  }
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}