// src/lib/validationRules.ts

export type CellRule =
  | 'numbers'
  | 'currency'      // vírgula decimal — Contas a Pagar, Produtos
  | 'currency_dot'  // ponto decimal   — Contas a Receber
  | 'date'
  | 'binary'
  | 'juros'
  | 'stock'
  | 'text';

export interface FileTypeConfig {
  label: string;
  skipRows: number;
  requiredColumns: string[];
  cellRules: Record<string, CellRule | CellRule[]>;
  columnAliases?: Record<string, string[]>;
  addressColumns?: string[];
  requiredValueColumns?: string[];
  leadingZeroColumns?: string[];
  unitColumn?: string;
  charLimits?: Record<string, number>;
}

// ─── Tipos de ficheiro ────────────────────────────────────────────────────────

export const FILE_TYPES: Record<string, FileTypeConfig> = {

  clientes: {
    label: 'Clientes e Fornecedores',
    skipRows: 0,
    requiredColumns: ['Código', 'Nome/Razão Social', 'Isento I.E', 'Simples Nacional', 'Cliente', 'Fornecedor'],
    cellRules: {
      'Código':                   'numbers',
      'CPF/CNPJ':                 'text',
      // PENDENTE (manual, item 1): o resumo do modelo cita "I.E" como obrigatória,
      // mas a descrição detalhada diz que só "Isento I.E" é obrigatório.
      // Mantido como NÃO obrigatório até confirmação do time responsável.
      'I.E':                      'text',
      'Isento I.E':               'binary',
      'Simples Nacional':         'binary',
      'Data Nascimento/Fundação': 'date',
      'Telefone':                 ['text', 'numbers'],
      'Celular':                  ['text', 'numbers'],
      'Data Cadastro':            'date',
      'Hora Cadastro':            'text',
      'Cliente':                  'binary',
      'Fornecedor':               'binary',
      'Forn. Produto':            'binary',
      'Forn. Serviço':            'binary',
      'Forn. Transporte':         'binary',
    },
    requiredValueColumns: ['Cliente', 'Fornecedor'],
    charLimits: {
      'Código':            11,
      'Nome/Razão Social': 60,
      'Apelido':           60,
      'Telefone':          10,
      'Celular':           11,
      'Email':             80,
      'CEP':               8,
      'Logradouro':        150,
      'Número':            8,
      'Complemento':       50,
      'Bairro':            50,
      'Referência':        50,
      'Cidade':            50,
      'Estado':            2,
      'Observação':        300,
    },
    leadingZeroColumns: ['CPF/CNPJ', 'I.E'],
    columnAliases: {
      'Código':                   ['Cod', 'Cod.', 'codigo', 'Codigo', 'id', 'idpessoa', 'IdPessoa'],
      'Nome/Razão Social':        ['Nome', 'Razão Social', 'Razao Social', 'nome', 'Descricao'],
      'Apelido':                  ['Nome Fantasia', 'Fantasia', 'apelido'],
      'I.E':                      ['I.E.', 'IE', 'Inscrição Estadual', 'Inscricao Estadual', 'CNH', 'CNH/IE'],
      'Isento I.E':               ['Isento IE', 'IsentoIE', 'Isento de IE', 'Isento de I.E', 'Isento de I.E.'],
      'CPF/CNPJ':                 ['CNPJ', 'CPF', 'CPF / CNPJ', 'cpf/cnpj', 'Cpf/Cnpj'],
      'Telefone':                 ['Tel', 'Tel.', 'Fone', 'telefone'],
      'Celular':                  ['Cel', 'Cel.', 'celular', 'WhatsApp'],
      'Data Nascimento/Fundação': ['Data Nascimento', 'Data Fundação', 'Nascimento', 'Fundação'],
      'Data Cadastro':            ['Dt Cadastro', 'Data de Cadastro', 'cadastro'],
      'Hora Cadastro':            ['Hora', 'Hora Cad', 'Hr Cadastro'],
      'Simples Nacional':         ['Simples', 'SN'],
      'Cliente':                  ['cliente', 'cli'],
      'Fornecedor':               ['fornecedor', 'forn'],
      'Forn. Produto':            ['Fornecedor Produto', 'Forn Produto', 'FornProduto', 'Forn. de Produto'],
      'Forn. Serviço':            ['Fornecedor Servico', 'Forn Servico', 'FornServico', 'Forn. de Serviço', 'Forn. Servico'],
      'Forn. Transporte':         ['Fornecedor Transporte', 'Forn Transporte', 'FornTransporte', 'Forn. de Transporte'],
      'Observação':               ['Obs', 'Observacao', 'obs', 'Notas', 'Nota'],
    },
    addressColumns: ['CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro', 'Referência', 'Cidade', 'Estado'],
  },

  produtoSimples: {
    label: 'Produto Simples',
    skipRows: 0,
    requiredColumns: ['Código', 'Descrição do produto', 'Preço Venda', 'Ativo'],
    cellRules: {
      'Código':               'numbers',
      // NOVO — coluna existia no manual e faltava no validador (até 13 caracteres
      // por código, vários códigos separados por vírgula, limite de 300/célula).
      'Código de barras':     'text',
      'CEST':                 'text',
      'NCM':                  'text',
      'CSOSN':                'text',
      // NOVO — "Origem": Somente números inteiros (não existia no validador).
      'Origem':               'numbers',
      'Qtd. Estoque':         'stock',
      'Preço Custo':          'currency',
      'Preço Venda':          'currency',
      'Data Cadastro':        'date',
      // Validade = quantidade de dias (inteiro), NÃO uma data.
      // PENDENTE (manual, item 2): o modelo formata a coluna como Data (AAAA-MM-DD),
      // mas a descrição diz que é uma quantidade de dias. Mantido como número
      // até confirmação — se a resposta for "é data mesmo", trocar para 'date'.
      'Validade':             'numbers',
      'Ativo':                'binary',
      'Balança':              'binary',
      'Balança Checkout':     'binary',
      // NOVO — "Grupo": texto livre (nome do grupo de produto), separado de
      // "Grupo Tributário" (numérico). Ver PENDENTE abaixo (item 3).
      'Grupo':                'text',
      // PENDENTE (manual, item 3): "Código grupo" é numérico no modelo, mas a
      // descrição fala em grupo TRIBUTÁRIO, não em grupo de produto. Mantido
      // como campo separado de "Grupo" até confirmação de qual é qual.
      'Grupo Tributário':     'numbers',
    },
    // CSOSN mantido como Texto (pode iniciar com zero, ex: "0102"), mesmo o
    // manual descrevendo o campo como "Geral" — ver PENDENTE item 4 abaixo
    // (a coluna "Código tributário" citada nas regras de CSOSN/Origem não
    // existe no modelo; confirmar com o time antes de mudar este comportamento).
    leadingZeroColumns: ['CEST', 'NCM', 'CSOSN'],
    unitColumn: 'Unidade',
    charLimits: {
      'Código':               11,
      'Código de barras':     300,
      'Descrição do produto': 60,
      'Referência':           120,
      'Marca':                80,
      'Grupo':                50,
      'NCM':                  8,
      'CEST':                 7,
      'Unidade':              3,
      'Observação':           300,
    },
    columnAliases: {
      'Código':               ['Cod', 'Cod.', 'codigo', 'Codigo', 'ID'],
      'Código de barras':     ['Codigo de Barras', 'Cod Barras', 'Cod. Barras', 'EAN', 'CodBarras', 'codigo_barras'],
      'Descrição do produto': ['Descrição', 'Descricao', 'Desc', 'Produto', 'Nome'],
      'Referência':           ['Referencia', 'Ref', 'Ref.'],
      'Marca':                ['marca'],
      'CEST':                 ['cest', 'Cest'],
      'NCM':                  ['ncm', 'Ncm', 'Codigo NCM', 'Cod NCM'],
      'CSOSN':                ['csosn', 'Csosn', 'CRT', 'crt'],
      'Origem':               ['origem', 'Origem Mercadoria', 'Cod Origem'],
      'Qtd. Estoque':         ['Qtd Estoque', 'Quantidade', 'Estoque', 'Qtd'],
      'Preço Custo':          ['Preco Custo', 'Custo', 'preco_custo'],
      'Preço Venda':          ['Preco Venda', 'Venda', 'preco_venda'],
      'Data Cadastro':        ['Dt Cadastro', 'Data de Cadastro'],
      'Validade':             ['Dt Validade', 'Dias Validade', 'Dias Val'],
      'Unidade':              ['Unid', 'unidade', 'Un', 'UN', 'UND', 'und'],
      'Ativo':                ['ativo', 'Status'],
      'Balança':              ['Balanca', 'balanca'],
      'Grupo':                ['grupo', 'Grupo Produto', 'Grupo de Produto'],
      'Grupo Tributário':     ['Código Grupo', 'Código Grupo Tributário', 'Tributação', 'grupo tributario', 'grupo tributário'],
      'Balança Checkout':     ['Balanca Checkout', 'BalancaCheckout', 'Checkout'],
    },
  },

  produtoGrade: {
    label: 'Produtos de Grade',
    skipRows: 0,
    requiredColumns: ['ProdutoId', 'EmpresaId'],
    // NOTA: "Coluna" (obrigatória se TipoColuna preenchido) e "Linha" (obrigatória
    // se TipoLinha preenchido) são condicionais no manual. O validador ainda não
    // tem um mecanismo de "obrigatório condicional" fora do bloco de endereço de
    // Clientes/Fornecedores — precisa de ajuste em validateFile.ts para checar
    // essa dependência linha a linha. Por ora os campos foram adicionados como
    // opcionais (a checagem condicional fica pendente de implementação).
    cellRules: {
      'ProdutoId':   'numbers',
      'EmpresaId':   'numbers',
      'Coluna':      'text',
      'TipoColuna':  'text',
      'Linha':       'text',
      'TipoLinha':   'text',
      // NOVO — mesma regra de Produto Simples: até 13 caracteres por código,
      // vários separados por vírgula.
      'CodBarras':   'text',
      'Qtd':         'stock',
      'QtdMin':      'stock',
      'Estoque':     'stock',
      'PrecoCusto':  'currency',
      'Custo':       'currency',
      'Preco':       'currency',
      'PrecoVenda':  'currency',
      'Margem':      'currency',
      'Desconto':    'currency',
    },
    unitColumn: 'Unidade',
    charLimits: {
      'Coluna':     50,
      'TipoColuna': 50,
      'Linha':      50,
      'TipoLinha':  50,
      'CodBarras':  300,
    },
    columnAliases: {
      'ProdutoId':  ['Produto Id', 'produto_id', 'ID Produto', 'Codigo Produto', 'CodigoProduto'],
      'EmpresaId':  ['Empresa Id', 'empresa_id', 'ID Empresa', 'Codigo Empresa', 'CodigoEmpresa'],
      'CodBarras':  ['Codigo de Barras', 'Cod Barras', 'Cod. Barras', 'EAN', 'Código de barras'],
      'Qtd':        ['Quantidade', 'Qtd.', 'qtd', 'Qtd Estoque', 'QTD'],
      'QtdMin':     ['Qtd Min', 'Qtd. Min', 'Qtd Minima', 'Estoque Minimo', 'EstoqueMin'],
      'Estoque':    ['Saldo Estoque', 'Saldo', 'Estoque Atual'],
      'PrecoCusto': ['Preço Custo', 'Preco Custo', 'preco_custo'],
      'Custo':      ['CustoUnit', 'Custo Unitario'],
      'Preco':      ['Preço', 'preco', 'Preco Base'],
      'PrecoVenda': ['Preço Venda', 'Preco Venda', 'preco_venda', 'Venda', 'Preco de Venda', 'Preço de Venda'],
      'Margem':     ['Margem (%)', 'Margem Lucro', 'margem'],
      'Desconto':   ['Desconto (%)', 'Desc', 'desconto'],
      'Unidade':    ['Unid', 'unidade', 'Un', 'UN', 'UND', 'und'],
    },
  },

  contasPagar: {
    label: 'Contas a Pagar',
    skipRows: 0,
    requiredColumns: ['Código da Pessoa', 'Código da Empresa', 'Valor'],
    // PENDENTE (manual, item 6): o modelo cita limite de 2 caracteres para
    // "Código da Pessoa" em Contas a Pagar, diferente de todas as outras
    // planilhas (9 ou 11 caracteres). Muito provavelmente um erro do modelo —
    // NÃO foi aplicado limite de caracteres aqui até confirmação.
    requiredValueColumns: ['Código da Pessoa', 'Código da Empresa'],
    cellRules: {
      'Código da Pessoa':   'numbers',
      'Código da Empresa':  'numbers',
      // Contas a Pagar → vírgula como separador decimal
      'Valor':              'currency',
      'Desconto':           'currency',
      'Carência':           'numbers',
      'Juros':              'juros',
      'Multa':              'juros',
      'Data da Emissão':    'date',
      'Data de Vencimento': 'date',
    },
    // NOVO — limites de caracteres para os campos de texto livre citados no manual.
    charLimits: {
      'Descrição': 80,
      'Categoria': 80,
      'Documento': 80,
    },
    columnAliases: {
      'Código da Pessoa':   ['Pessoa', 'Cod Pessoa', 'CodPessoa', 'ID Pessoa', 'PessoaId', 'Pessoa Id', 'pessoa_id', 'CodigoPessoa', 'Codigo Pessoa'],
      'Código da Empresa':  ['Empresa', 'Emp', 'Cod Empresa', 'CodEmpresa', 'ID Empresa', 'EmpresaId', 'Empresa Id', 'empresa_id', 'CodigoEmpresa', 'Codigo Empresa'],
      'Valor':              ['Valor Total', 'Vl Total', 'Vl. Total'],
      'Carência':           ['Carencia', 'Dias Carência', 'Dias Carencia'],
      'Juros':              ['Juros (%)', 'Taxa Juros', 'Juro'],
      'Multa':              ['Multa (%)', 'Taxa Multa'],
      'Desconto':           ['Desc', 'Desconto (%)'],
      'Descrição':          ['Descricao', 'Desc.'],
      'Categoria':          ['categoria', 'Categoria Financeira'],
      'Documento':          ['Doc', 'Doc.', 'Nº Documento', 'Numero Documento'],
      'Data da Emissão':    ['Dt Emissão', 'Emissão', 'Data Emissao'],
      'Data de Vencimento': ['Dt Vencimento', 'Vencimento', 'Dt Venc'],
    },
  },

  contasReceber: {
    label: 'Contas a Receber',
    skipRows: 0,
    requiredColumns: ['Código da Pessoa', 'Código da Empresa', 'Valor em Aberto'],
    requiredValueColumns: ['Código da Pessoa', 'Código da Empresa'],
    cellRules: {
      'Código da Pessoa':  'numbers',
      'Código da Empresa': 'numbers',
      // Contas a Receber → PONTO como separador decimal (currency_dot)
      'Valor em Aberto':   'currency_dot',
      'Valor Quitado':     'currency_dot',
      // ATUALIZADO — o manual separa "Carência Multa (dias)" e "Carência Juros
      // (dias)" como campos distintos (antes havia apenas um campo "Carência").
      'Carência Multa':    'numbers',
      'Carência Juros':    'numbers',
      'Juros':             'juros',
      'Multa':             'juros',
      'Desconto':          'currency_dot',
      'Data de Emissão':   'date',
      'Data de Vencimento':'date',
      'Vencimento':        'date',
      'Recebimento':       'date',
      // NOVO — campos citados no manual e ausentes do validador.
      'Nome de Cliente':   'text',
      'CPF/CNPJ':          'text',
    },
    // "Atenção aos documentos iniciados em zero" no manual → precisa de Texto.
    leadingZeroColumns: ['CPF/CNPJ'],
    charLimits: {
      'Descrição':       80,
      'Observação':      300,
      'Documento':       50,
      'Nome de Cliente': 60,
    },
    columnAliases: {
      'Código da Pessoa':  ['Cod Pessoa', 'CodPessoa', 'ID Pessoa', 'PessoaId', 'Pessoa Id', 'pessoa_id', 'CodigoPessoa', 'Codigo Pessoa'],
      'Código da Empresa': ['Cod Empresa', 'CodEmpresa', 'ID Empresa', 'EmpresaId', 'Empresa Id', 'empresa_id', 'CodigoEmpresa', 'Codigo Empresa'],
      'Valor em Aberto':   ['Vl Aberto', 'Saldo', 'Valor Aberto'],
      'Valor Quitado':     ['Vl Quitado', 'Quitado', 'Valor Pago'],
      'Carência Multa':    ['Carência Multa (dias)', 'Carencia Multa', 'Dias Carência Multa'],
      'Carência Juros':    ['Carência Juros (dias)', 'Carencia Juros', 'Dias Carência Juros'],
      'Juros':             ['Juros (%)', 'Taxa Juros', 'Juro'],
      'Multa':             ['Multa (%)', 'Taxa Multa'],
      'Desconto':          ['Desc', 'Desconto (%)'],
      'Descrição':         ['Descricao', 'Desc.'],
      'Documento':         ['Doc', 'Doc.', 'Nº Documento'],
      'Nome de Cliente':   ['Nome Cliente', 'Cliente'],
      'CPF/CNPJ':          ['CNPJ', 'CPF', 'CPF / CNPJ', 'cpf/cnpj'],
      'Data de Emissão':   ['Dt Emissão', 'Emissão', 'Data Emissao'],
      'Data de Vencimento':['Dt Vencimento', 'Vencimento', 'Dt Venc'],
      'Recebimento':       ['Dt Recebimento', 'Data Recebimento', 'Dt Rec'],
    },
  },
};

// ─── Validators ───────────────────────────────────────────────────────────────

export const VALIDATORS: Record<CellRule, {
  test: (val: string) => boolean;
  label: string;
  numberAsTextLabel: string;
}> = {
  numbers: {
    test: (val: string) => {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) return true;
      const num = Number(trimmed);
      return Number.isFinite(num) && Number.isInteger(num) && num >= 0;
    },
    label: 'Valor inválido — esta coluna aceita apenas números inteiros positivos (sem letras, símbolos ou casas decimais)',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Geral"',
  },

  date: {
    test: (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val.trim()),
    label: 'Data em formato inválido — use o padrão AAAA-MM-DD (ex: 2024-12-31)',
    numberAsTextLabel: '',
  },

  // Contas a Pagar + Produtos — separador decimal: VÍRGULA
  currency: {
    test: (val: string) => {
      const trimmed = val.trim();
      return /^\d+([,.]?\d+)?$/.test(trimmed);
    },
    label: 'Valor de moeda inválido — use vírgula como separador decimal e não inclua "R$" (ex: 1250,99)',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Moeda" (decimais com vírgula)',
  },

  // Contas a Receber — separador decimal: PONTO
  currency_dot: {
    test: (val: string) => {
      const trimmed = val.trim();
      return /^\d+([.]?\d+)?$/.test(trimmed);
    },
    label: 'Valor de moeda inválido — use ponto como separador decimal e não inclua "R$" (ex: 1250.99)',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Moeda" (decimais com ponto)',
  },

  binary: {
    test: (val: string) => /^[01]$/.test(val.trim()),
    label: 'Valor inválido — esta coluna só aceita 0 (Não) ou 1 (Sim)',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Geral" (apenas 0 ou 1)',
  },

  juros: {
    test: (val: string) => {
      const trimmed = val.trim();
      const normalized = trimmed.replace(',', '.');
      const num = Number(normalized);
      if (!Number.isFinite(num) || num < 0) return false;
      const [intPart, decPart = ''] = normalized.split('.');
      if (intPart.length > 3) return false;
      if (decPart.length > 2) return false;
      return true;
    },
    label: 'Valor inválido — juros/multa deve ter no máximo 3 dígitos inteiros e 2 decimais com vírgula (ex: 10,50), formato Geral',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Geral" (ex: 10,50)',
  },

  stock: {
    test: (val: string) => {
      const trimmed = val.trim();
      const num = Number(trimmed);
      // A exigência de número inteiro é condicional à Unidade da linha ("Unidade"/UN)
      // e é aplicada em validateColumn (validateFile.ts), que tem acesso à coluna
      // de Unidade. Aqui, fora desse contexto, apenas valida que é um número finito.
      return Number.isFinite(num);
    },
    label: 'Valor inválido — esta coluna aceita apenas números (quantidade em estoque)',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Número" (inteiros, pode ser negativo)',
  },

  text: {
    test: (val: string) => val.trim().length > 0,
    label: 'Valor inválido — este campo não pode ficar vazio e deve estar formatado como Texto no Excel (preserva zeros à esquerda)',
    numberAsTextLabel: '',
  },
};

export function validateCell(
  rule: CellRule | CellRule[],
  val: string,
): { valid: boolean; label: string } {
  const rules = Array.isArray(rule) ? rule : [rule];
  const valid = rules.some(r => VALIDATORS[r].test(val));
  const label = rules.map(r => VALIDATORS[r].label).join(' ou ');
  return { valid, label };
}