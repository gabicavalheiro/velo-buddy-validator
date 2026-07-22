import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Package, Grid3X3, CreditCard, TrendingDown,
  AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp, Lightbulb,
  Eraser, Copy, Check,
} from 'lucide-react';

interface GuideItem {
  label?: string;
  text?: string;
  warning?: boolean;
  // Bloco de código (ex: macro VBA) — renderizado em monospace, com botão de copiar.
  code?: string;
  codeLabel?: string;
}

interface GuideSection {
  id: string;
  icon: React.ReactNode;
  color: string;
  title: string;
  items: GuideItem[];
}

// ─── Macros VBA — remoção/substituição de caracteres especiais e invisíveis ───

const VBA_LIMPAR_CARACTERES = `Sub LimparCaracteresV2()
    Dim ws As Worksheet
    Dim cel As Range
    Dim texto As String
    Dim i As Integer
    Dim novoTexto As String
    Dim codigo As Integer
    Dim c As String

    ' Caracteres especiais que você quer remover, além dos invisíveis
    Dim removerExtra As String
    removerExtra = "()|%*&{}[]<>^~\`@#$+=""'"

    Set ws = ActiveSheet
    Application.ScreenUpdating = False

    For Each cel In ws.UsedRange
        If Not IsEmpty(cel.Value) And VarType(cel.Value) = vbString Then
            texto = cel.Value
            novoTexto = ""

            For i = 1 To Len(texto)
                c = Mid(texto, i, 1)
                codigo = AscW(c)

                If InStr(removerExtra, c) > 0 Then
                    ' está na lista de remoção, descarta
                ElseIf (codigo >= 32 And codigo <= 126) Or _
                       (codigo >= 192 And codigo <= 255) Then
                    novoTexto = novoTexto & c
                ElseIf codigo = 32 Then
                    novoTexto = novoTexto & " "
                End If
                ' qualquer outro código (invisível, controle) é descartado
            Next i

            Do While InStr(novoTexto, "  ") > 0
                novoTexto = Replace(novoTexto, "  ", " ")
            Loop
            novoTexto = Trim(novoTexto)

            If novoTexto <> texto Then
                cel.Value = novoTexto
            End If
        End If
    Next cel

    Application.ScreenUpdating = True
    MsgBox "Limpeza concluída!", vbInformation
End Sub`;

const VBA_SUBSTITUIR_INVISIVEIS = `Sub SubstituirPorEspacosReais()
    Dim ws As Worksheet
    Dim celula As Range
    Dim texto As String

    For Each ws In ThisWorkbook.Worksheets
        For Each celula In ws.UsedRange
            If celula.HasFormula = False And Not IsEmpty(celula.Value) Then
                If VarType(celula.Value) = vbString Then
                    texto = celula.Value
                    texto = Replace(texto, Chr(160), " ")    ' espaço não separável (nbsp)
                    texto = Replace(texto, Chr(9), " ")      ' tab
                    texto = Replace(texto, ChrW(8203), " ")  ' zero-width space
                    texto = Replace(texto, ChrW(65279), " ") ' BOM / zero-width no-break space
                    texto = Replace(texto, ChrW(8194), " ")  ' en space
                    texto = Replace(texto, ChrW(8195), " ")  ' em space
                    texto = Replace(texto, ChrW(8201), " ")  ' thin space
                    texto = Replace(texto, ChrW(12288), " ") ' espaço largo (ideográfico)

                    If texto <> celula.Value Then
                        celula.Value = texto
                    End If
                End If
            End If
        Next celula
    Next ws

    MsgBox "Todos os caracteres invisíveis foram substituídos por espaços reais!"
End Sub`;

const SECTIONS: GuideSection[] = [
  {
    id: 'clientes',
    icon: <Users className="h-4 w-4" />,
    color: 'hsl(270 60% 38%)',
    title: 'Clientes e Fornecedores',
    items: [
      {
        label: 'Obrigatórios',
        text: 'Código, Nome/Razão Social, I.E, Simples Nacional, Cliente (1=Sim, 0=Não) e Fornecedor (1=Sim, 0=Não).',
      },
      {
        label: 'Endereço',
        text: 'Se preencher qualquer dado de endereço, todos os outros campos se tornam obrigatórios: CEP, Logradouro, Número, Complemento, Bairro, Referência, Cidade e Estado.',
      },
      {
        label: 'Fornecedor',
        text: 'Se for fornecedor, é obrigatório preencher o tipo: Forn. de Produto, Serviço e Transporte.',
      },
      {
        label: 'Formatação',
        text: 'Textos sem caracteres especiais. Datas sempre no padrão AAAA-MM-DD.',
      },
    ],
  },
  {
    id: 'produtoSimples',
    icon: <Package className="h-4 w-4" />,
    color: 'hsl(18 90% 52%)',
    title: 'Produto Simples',
    items: [
      {
        label: 'Obrigatórios',
        text: 'Código (apenas números, até 11 dígitos), Descrição do Produto, Preço de Venda e Ativo (1=Sim, 0=Não).',
      },
      {
        label: 'Preços',
        text: 'Formatação "Moeda" com limite de 10 caracteres e 2 decimais. Não digite "R$" manualmente.',
      },
      {
        label: 'Tributação',
        text: 'Se informar o código tributário, deixe as colunas CSOSN e Origem em branco.',
      },
    ],
  },
  {
    id: 'produtoGrade',
    icon: <Grid3X3 className="h-4 w-4" />,
    color: 'hsl(200 80% 42%)',
    title: 'Produtos de Grade',
    items: [
      {
        label: 'Obrigatórios',
        text: 'ProdutoId e EmpresaId — ambos precisam já estar cadastrados no sistema Velo.',
      },
      {
        label: 'Grades',
        text: 'Se preencher "TipoColuna" (ex: Cor), a coluna "Coluna" (ex: Azul) é obrigatória. O mesmo vale para "TipoLinha" e "Linha" (ex: Tamanho / M).',
      },
      {
        label: 'Valores e Estoque',
        text: 'Use vírgula para separar as casas decimais. Formate os preços como "Moeda".',
      },
    ],
  },
  {
    id: 'contasPagar',
    icon: <CreditCard className="h-4 w-4" />,
    color: 'hsl(340 70% 44%)',
    title: 'Contas a Pagar',
    items: [
      {
        label: 'Obrigatórios',
        text: 'Código da Pessoa e Código da Empresa — precisam existir previamente no Velo.',
      },
      {
        label: 'Valores',
        text: 'Formatação "Moeda" com até 2 casas decimais separadas por vírgula.',
      },
      {
        label: 'Datas',
        text: 'Padrão AAAA-MM-DD para emissão e vencimento.',
      },
      {
        warning: true,
        text: 'Reimportar apaga todas as contas importadas anteriormente e as registradas no PDV.',
      },
    ],
  },
  {
    id: 'contasReceber',
    icon: <TrendingDown className="h-4 w-4" />,
    color: 'hsl(145 55% 38%)',
    title: 'Contas a Receber',
    items: [
      {
        label: 'Obrigatórios',
        text: 'Código da Pessoa, Código da Empresa e Valor em Aberto.',
      },
      {
        label: 'Juros e Multas',
        text: 'Apenas números. Para tolerância de atraso, informe os dias (ex: 3). Para multas, informe a porcentagem com vírgula nas casas decimais.',
      },
      {
        warning: true,
        text: 'Uma nova importação substituirá todos os dados antigos do sistema.',
      },
    ],
  },
  {
    id: 'caracteresEspeciais',
    icon: <Eraser className="h-4 w-4" />,
    color: 'hsl(38 92% 46%)',
    title: 'Caracteres Especiais e Invisíveis',
    items: [
      {
        label: 'O que é',
        text: 'Espaços não separáveis (NBSP), zero-width space, BOM e outros caracteres invisíveis costumam vir de textos colados de sites ou PDFs. Eles não aparecem na célula, mas quebram a importação silenciosamente.',
      },
      {
        label: 'Como rodar um macro',
        text: 'No Excel: Alt+F11 (abre o editor VBA) → Inserir > Módulo → cole o código abaixo → feche o editor → Alt+F8 → escolha o macro → Executar.',
      },
      {
        codeLabel: 'Remover caracteres especiais (mantém letras, números, acentos e espaço)',
        code: VBA_LIMPAR_CARACTERES,
      },
      {
        codeLabel: 'Substituir caracteres invisíveis por espaço real',
        code: VBA_SUBSTITUIR_INVISIVEIS,
      },
      {
        warning: true,
        text: 'Faça uma cópia de segurança da planilha antes de rodar o macro — a alteração é aplicada direto nas células e é salva junto com o arquivo.',
      },
    ],
  },
];

// ─── Bloco de código com botão de copiar ──────────────────────────────────────

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard indisponível — ignora silenciosamente
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
        {label && <p className="text-xs font-semibold text-foreground truncate pr-2">{label}</p>}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shrink-0 transition-colors hover:bg-muted"
          style={{ color: copied ? 'hsl(145 55% 38%)' : 'hsl(270 60% 38%)' }}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <pre className="text-[11px] leading-relaxed p-3 overflow-x-auto max-h-56 overflow-y-auto">
        <code className="font-mono text-foreground whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

interface SectionCardProps {
  section: GuideSection;
}

function SectionCard({ section }: SectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ background: section.color }}
        >
          {section.icon}
        </div>
        <span className="flex-1 font-semibold text-sm text-foreground">{section.title}</span>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        }
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
            <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-border">
              {section.items.map((item, i) => {
                if (item.code) {
                  return <CodeBlock key={i} code={item.code} label={item.codeLabel} />;
                }
                return item.warning ? (
                  <div
                    key={i}
                    className="flex gap-2 rounded-lg px-3 py-2"
                    style={{ background: 'hsl(38 92% 52% / 0.1)', border: '1px solid hsl(38 92% 52% / 0.25)' }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'hsl(38 70% 40%)' }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'hsl(38 60% 30%)' }}>{item.text}</p>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.label && (
                        <strong className="text-foreground">{item.label}: </strong>
                      )}
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GuideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function GuideDrawer({ open, onClose }: GuideDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col bg-background shadow-2xl"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(270 60% 38%) 0%, hsl(290 55% 32%) 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold font-heading text-base leading-tight">Guia Rápido</h2>
                  <p className="text-white/65 text-xs mt-0.5">Regras de importação Velo</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Dica geral */}
            <div className="px-4 py-3 shrink-0 border-b border-border">
              <div
                className="rounded-xl px-3 py-2.5 flex gap-2.5"
                style={{ background: 'hsl(270 60% 38% / 0.07)', border: '1px solid hsl(270 60% 38% / 0.15)' }}
              >
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'hsl(270 60% 38%)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'hsl(270 50% 30%)' }}>
                  <strong>Recomendação:</strong> Crie sempre uma planilha em branco e preencha os dados seguindo as regras. Não reutilize planilhas antigas.
                </p>
              </div>
            </div>

            {/* Seções — scrollável */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
              {SECTIONS.map((section) => (
                <SectionCard key={section.id} section={section} />
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'hsl(270 60% 38%)' }}
              >
                Fechar guia
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}