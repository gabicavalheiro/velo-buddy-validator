# Validador de Planilhas Velo

Ferramenta web para validação de planilhas Excel antes da importação no sistema Velo. Detecta erros de formatação, colunas em falta, campos obrigatórios vazios, zeros à esquerda em risco e gera mensagens prontas para enviar ao cliente.

---

## Estrutura do Projeto

```
src/
├── assets/
│   └── logo-velo.png
├── components/
│   ├── ClientMessageModal.tsx   # Modal com mensagem pronta para o cliente
│   ├── ErrorDashboard.tsx       # Dashboard de erros após validação
│   ├── FileDropZone.tsx         # Componente de upload de ficheiro
│   ├── GuideDrawer.tsx          # Drawer lateral com guia rápido de importação
│   └── HelpModal.tsx            # Modal "Como corrigir?" com passos detalhados
├── lib/
│   ├── validateFile.ts          # Motor de validação e leitura de XLSX
│   └── validationRules.ts       # Configurações, regras e aliases por tipo de ficheiro
└── pages/
    └── Index.tsx                # Página principal da aplicação
```

---

## Tipos de Ficheiro Suportados

| Chave | Label |
|---|---|
| `clientes` | Clientes e Fornecedores |
| `produtoSimples` | Produto Simples |
| `produtoGrade` | Produtos de Grade |
| `contasPagar` | Contas a Pagar |
| `contasReceber` | Contas a Receber |

---

## Regras de Validação por Tipo de Célula

### Tipos disponíveis (`CellRule`)

| Tipo | Descrição | Aceita |
|---|---|---|
| `numbers` | Números inteiros positivos | `123`, `456` |
| `currency` | Valores monetários | `1250,99`, `10.5` |
| `date` | Datas no padrão AAAA-MM-DD | `2024-12-31` |
| `binary` | Booleano | `0` ou `1` |
| `juros` | Taxa de juros/multa | Até 3 inteiros e 2 decimais com vírgula: `10,50` |
| `stock` | Quantidade em estoque | Inteiros positivos ou negativos; decimais se `Unidade = KG` |

---

## Detecção de Erros

### 1. Número armazenado como texto
Quando uma coluna numérica chega do Excel como `string` (triângulo verde na célula), o sistema detecta e informa o formato correto a aplicar após converter:

| Regra da coluna | Label do erro |
|---|---|
| `currency` | "...aplique o formato Moeda" |
| `stock` | "...aplique o formato Número (inteiros)" |
| `juros` | "...aplique o formato Geral (ex: 10,50)" |
| `numbers` | "...aplique o formato Geral" |

### 2. Zeros à esquerda em risco (`leadingZeroColumns`)
Colunas onde o formato numérico do Excel apaga zeros significativos. Devem estar formatadas como **Texto** ou **Geral**.

| Tipo de ficheiro | Colunas protegidas |
|---|---|
| Clientes e Fornecedores | `CPF/CNPJ`, `I.E` |
| Produto Simples | `CEST`, `NCM`, `CSOSN` |

Comportamento:
- `typeof number` → erro LEADING_ZERO (zeros perdidos)
- `typeof string` (Texto/Geral) → correto, sem erro

### 3. Data em formato de data do Excel (serial)
Quando a célula está formatada como Data no Excel, o valor chega como número serial (ex: `44196`). O sistema converte e exibe o valor legível no relatório, e orienta a corrigir para o padrão `AAAA-MM-DD`.

### 4. Data em formato incorreto
Quando a data está como texto mas num formato não aceite (ex: `31/12/2024`). O sistema orienta a converter para `AAAA-MM-DD`.

### 5. Campo obrigatório vazio (`requiredValueColumns`)
Colunas onde cada linha deve obrigatoriamente ter valor. Detecta e lista as linhas com células vazias.

| Tipo de ficheiro | Colunas obrigatórias por linha |
|---|---|
| Contas a Pagar | `Código da Pessoa`, `Código da Empresa` |
| Contas a Receber | `Código da Pessoa`, `Código da Empresa` |

### 6. Colunas obrigatórias em falta
Verifica se todas as colunas definidas em `requiredColumns` existem no cabeçalho da planilha.

### 7. Endereço incompleto
Quando qualquer campo de endereço é preenchido, **todos** se tornam obrigatórios: `CEP`, `LOGRADOURO`, `NÚMERO`, `COMPLEMENTO`, `BAIRRO`, `REFERÊNCIA`, `CIDADE` e `ESTADO`. O dashboard exibe um card laranja de destaque e a mensagem para o cliente inclui a lista completa.

### 8. Linha de instruções detectada
Se a linha 2 da planilha contém textos longos ou palavras-chave típicas de instruções (ex: "obrigatório", "informe", "utilize o padrão"), o sistema bloqueia a validação e alerta que essa linha deve ser apagada antes de importar.

### 9. Varredura universal de número como texto
Após validar as colunas do `cellRules`, o sistema percorre **todas as colunas da planilha** — incluindo as que não estão mapeadas em regras — e deteta qualquer célula com valor numérico armazenado como texto. Nenhuma coluna escapa desta verificação.

### 10. Validação cruzada: Estoque × Unidade
Colunas de tipo `stock` aceitam:
- Inteiros positivos ou negativos em qualquer caso
- Decimais **apenas quando** a coluna `Unidade` da mesma linha for `KG` (ou variantes: `kg`, `kilo`, `quilograma`)

---

## Resolução de Colunas (`resolveColumnIndices`)

A leitura do cabeçalho é tolerante a variações. Para cada coluna canónica (ex: `Código da Pessoa`), o sistema tenta encontrá-la na planilha por:

1. **Correspondência exacta** — string idêntica
2. **Normalização** — sem acentos, lowercase, espaços colapsados, sem caracteres invisíveis
3. **Aliases** — lista de nomes alternativos configurados por tipo de ficheiro

Exemplo de aliases para `Código da Pessoa`:
`PessoaId`, `Pessoa Id`, `pessoa_id`, `CodigoPessoa`, `Codigo Pessoa`, `Cod Pessoa`, `CodPessoa`, `ID Pessoa`

---

## Aliases Configurados

### Clientes e Fornecedores
| Coluna canónica | Aliases principais |
|---|---|
| `CPF/CNPJ` | `CNPJ`, `CPF`, `CPF / CNPJ` |
| `I.E` | `IE`, `Inscrição Estadual`, `CNH/IE` |
| `Código` | `Cod`, `Cod.`, `codigo` |

### Produto Simples
| Coluna canónica | Aliases principais |
|---|---|
| `Descrição do produto` | `Descrição`, `Desc`, `Produto` |
| `CEST` | `cest`, `Cest` |
| `NCM` | `ncm`, `Codigo NCM`, `Cod NCM` |
| `CSOSN` | `csosn`, `CRT` |
| `Qtd. Estoque` | `Qtd Estoque`, `Quantidade`, `Estoque`, `Qtd` |

### Contas a Pagar / Contas a Receber
| Coluna canónica | Aliases principais |
|---|---|
| `Código da Pessoa` | `PessoaId`, `Pessoa Id`, `CodPessoa`, `CodigoPessoa` |
| `Código da Empresa` | `EmpresaId`, `Empresa Id`, `CodEmpresa`, `CodigoEmpresa` |

---

## Trimming de Linhas Vazias

Antes de qualquer validação, o sistema remove automaticamente as linhas completamente vazias do final da planilha. O Excel frequentemente inclui linhas "fantasma" no `usedRange` após os dados reais, o que causaria falsos positivos de "campo obrigatório vazio".

---

## Componentes de Interface

### `ErrorDashboard`
Exibe após a validação. Contém:
- Cards de resumo: nome do ficheiro, total de linhas, total de erros
- Banner laranja para linha de instruções detectada
- Card de destaque laranja para regra de endereço (quando aplicável)
- Card explicativo para regra de Juros/Multa
- Lista de erros por coluna com expandir/recolher e tabela de linhas afetadas
- Botão "Como corrigir?" em cada erro de formatação
- Botão "Gerar mensagem para o cliente"

### `HelpModal`
Modal "Como corrigir?" com 4 passos visuais numerados. O **passo 4** é dinâmico e indica o formato final correto para cada tipo de coluna:

| Tipo | Passo 4 |
|---|---|
| `currency` | Aplicar formato **Moeda** |
| `stock` | Aplicar formato **Número** (0 casas decimais) |
| `numbers` / `juros` / `binary` | Aplicar formato **Geral** |
| `date` serial | Formatar como Data AAAA-MM-DD com localidade Inglês (EUA) |
| `leadingZero` | Formatar como **Texto** antes de digitar |

### `ClientMessageModal`
Gera uma mensagem formatada para WhatsApp (com `*negrito*` e emojis) pronta para copiar e enviar ao cliente. A mensagem inclui:
- Nome do ficheiro e tipo
- Cada tipo de erro com instruções específicas
- Formato final correto por tipo de coluna
- Lista completa de campos de endereço (quando aplicável)
- Botão de cópia com confirmação visual

### `GuideDrawer`
Drawer lateral com guia rápido de importação para cada tipo de ficheiro. Acessível pelo botão "Guia Rápido" no desktop ou "Guia" no mobile.

---

## Constantes Exportadas (`validateFile.ts`)

| Constante | Uso |
|---|---|
| `NUMBER_AS_TEXT_PREFIX` | Prefixo para detecção de erros "número como texto" (via `startsWith`) |
| `LEADING_ZERO_LABEL` | Label para colunas com zeros à esquerda em risco |
| `DATE_AS_SERIAL_LABEL` | Label para datas em formato serial do Excel |
| `DATE_WRONG_FORMAT_LABEL` | Label para datas em formato de texto incorreto |
| `REQUIRED_VALUE_LABEL` | Label para campos obrigatórios vazios por linha |
| `INSTRUCTION_ROW_LABEL` | Label para linha de instruções detectada na linha 2 |
| `JUROS_RULE_LABEL` | Label para valores de juros/multa fora do padrão |

---

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## Tecnologias Utilizadas

- **React** + **TypeScript** — interface e lógica
- **Vite** — bundler
- **xlsx (SheetJS)** — leitura de ficheiros Excel
- **Framer Motion** — animações
- **Tailwind CSS** — estilização
- **shadcn/ui** — componentes base
- **Lucide React** — ícones
- **canvas-confetti** — celebração ao validar com sucesso
