export type CellRule = 'numbers' | 'date' | 'currency' | 'binary' | 'juros' | 'stock' | 'text';

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
}

export const FILE_TYPES: Record<string, FileTypeConfig> = {
  clientes: {
    label: 'Clientes e Fornecedores',
    skipRows: 0,
    requiredColumns: ['Código', 'Nome/Razão Social', 'I.E', 'Simples Nacional', 'Cliente', 'Fornecedor'],
    cellRules: {
      'Código':                   'numbers',
      'CPF/CNPJ':                 'text',
      'I.E':                      'text',
      'Telefone':                 ['text', 'numbers'],
      'Celular':                  ['text', 'numbers'],
      'Data Nascimento/Fundação': 'date',
      'Data Cadastro':            'date',
      'Simples Nacional':         'binary',
      'Cliente':                  'binary',
      'Fornecedor':               'binary',
    },
    leadingZeroColumns: ['CPF/CNPJ', 'I.E'],
    columnAliases: {
      'Código':                   ['Cod', 'Cod.', 'codigo', 'Codigo', 'id', 'idpessoa', 'IdPessoa'],
      'Nome/Razão Social':        ['Nome', 'Razão Social', 'Razao Social', 'nome', 'Descricao'],
      'I.E':                      ['I.E.', 'IE', 'Inscrição Estadual', 'Inscricao Estadual', 'CNH', 'CNH/IE'],
      'CPF/CNPJ':                 ['CNPJ', 'CPF', 'CPF / CNPJ', 'cpf/cnpj', 'Cpf/Cnpj'],
      'Telefone':                 ['Tel', 'Tel.', 'Fone', 'telefone'],
      'Celular':                  ['Cel', 'Cel.', 'celular', 'WhatsApp'],
      'Data Nascimento/Fundação': ['Data Nascimento', 'Data Fundação', 'Nascimento', 'Fundação'],
      'Data Cadastro':            ['Dt Cadastro', 'Data de Cadastro', 'cadastro'],
      'Simples Nacional':         ['Simples', 'SN'],
      'Cliente':                  ['cliente', 'cli'],
      'Fornecedor':               ['fornecedor', 'forn'],
    },
    addressColumns: ['CEP', 'Logradouro', 'Número', 'Bairro', 'Cidade', 'Estado', 'País'],
  },
  produtoSimples: {
    label: 'Produto Simples',
    skipRows: 0,
    requiredColumns: ['Código', 'Descrição do produto', 'Preço Venda', 'Ativo'],
    cellRules: {
      'Código':        'numbers',
      'CEST':          'text',
      'NCM':           'text',
      'CSOSN':         'text',
      'Qtd. Estoque':  'stock',
      'Preço Custo':   'currency',
      'Preço Venda':   'currency',
      'Data Cadastro': 'date',
      'Validade':      'date',
      'Ativo':         'binary',
      'Balança':       'binary',
    },
    leadingZeroColumns: ['CEST', 'NCM'],
    unitColumn: 'Unidade',
    columnAliases: {
      'Código':               ['Cod', 'Cod.', 'codigo', 'Codigo', 'ID'],
      'Descrição do produto': ['Descrição', 'Descricao', 'Desc', 'Produto', 'Nome'],
      'CEST':                 ['cest', 'Cest'],
      'NCM':                  ['ncm', 'Ncm', 'Codigo NCM', 'Cod NCM'],
      'CSOSN':                ['csosn', 'Csosn', 'CRT', 'crt'],
      'Qtd. Estoque':         ['Qtd Estoque', 'Quantidade', 'Estoque', 'Qtd'],
      'Preço Custo':          ['Preco Custo', 'Custo', 'preco_custo'],
      'Preço Venda':          ['Preco Venda', 'Venda', 'preco_venda'],
      'Data Cadastro':        ['Dt Cadastro', 'Data de Cadastro'],
      'Validade':             ['Dt Validade', 'Data Validade', 'Vencimento'],
      'Unidade':              ['Unid', 'unidade', 'Un', 'UN', 'UND', 'und'],
      'Ativo':                ['ativo', 'Status'],
      'Balança':              ['Balanca', 'balanca'],
    },
  },
  produtoGrade: {
    label: 'Produtos de Grade',
    skipRows: 0,
    requiredColumns: ['ProdutoId', 'EmpresaId'],
    cellRules: {
      'ProdutoId':  'numbers',
      'EmpresaId':  'numbers',
      'Qtd':        'stock',
      'Estoque':    'stock',
      'PrecoCusto': 'currency',
      'PrecoVenda': 'currency',
      'Margem':     'currency',
      'Desconto':   'currency',
    },
    unitColumn: 'Unidade',
    columnAliases: {
      'ProdutoId':  ['Produto Id', 'produto_id', 'ID Produto', 'PessoaId', 'Codigo Produto', 'CodigoProduto'],
      'EmpresaId':  ['Empresa Id', 'empresa_id', 'ID Empresa', 'Codigo Empresa', 'CodigoEmpresa'],
      'Qtd':        ['Quantidade', 'Qtd.', 'qtd', 'Qtd Estoque', 'QTD'],
      'Estoque':    ['Saldo Estoque', 'Saldo', 'Estoque Atual'],
      'PrecoCusto': ['Preço Custo', 'Preco Custo', 'preco_custo', 'Custo'],
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
    requiredValueColumns: ['Código da Pessoa', 'Código da Empresa'],
    cellRules: {
      'Código da Pessoa':   'numbers',
      'Código da Empresa':  'numbers',
      'Valor':              'currency',
      'Carência':           'numbers',
      'Juros':              'juros',
      'Multa':              'juros',
      'Desconto':           'currency',
      'Data da Emissão':    'date',
      'Data de Vencimento': 'date',
    },
    columnAliases: {
      'Código da Pessoa':   ['Cod Pessoa', 'CodPessoa', 'ID Pessoa', 'PessoaId', 'Pessoa Id', 'pessoa_id', 'CodigoPessoa', 'Codigo Pessoa'],
      'Código da Empresa':  ['Cod Empresa', 'CodEmpresa', 'ID Empresa', 'EmpresaId', 'Empresa Id', 'empresa_id', 'CodigoEmpresa', 'Codigo Empresa'],
      'Valor':              ['Valor Total', 'Vl Total', 'Vl.'],
      'Carência':           ['Carencia', 'Dias Carência', 'Dias Carencia'],
      'Juros':              ['Juros (%)', 'Taxa Juros', 'Juro'],
      'Multa':              ['Multa (%)', 'Taxa Multa'],
      'Desconto':           ['Desc', 'Desconto (%)'],
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
      'Valor em Aberto':   'currency',
      'Valor Quitado':     'currency',
      'Carência':          'numbers',
      'Juros':             'juros',
      'Multa':             'juros',
      'Desconto':          'currency',
      'Data de Emissão':   'date',
      'Vencimento':        'date',
      'Recebimento':       'date',
    },
    columnAliases: {
      'Código da Pessoa':  ['Cod Pessoa', 'CodPessoa', 'ID Pessoa', 'PessoaId', 'Pessoa Id', 'pessoa_id', 'CodigoPessoa', 'Codigo Pessoa'],
      'Código da Empresa': ['Cod Empresa', 'CodEmpresa', 'ID Empresa', 'EmpresaId', 'Empresa Id', 'empresa_id', 'CodigoEmpresa', 'Codigo Empresa'],
      'Valor em Aberto':   ['Vl Aberto', 'Saldo', 'Valor Aberto'],
      'Valor Quitado':     ['Vl Quitado', 'Quitado', 'Valor Pago'],
      'Carência':          ['Carencia', 'Dias Carência', 'Dias Carencia'],
      'Juros':             ['Juros (%)', 'Taxa Juros', 'Juro'],
      'Multa':             ['Multa (%)', 'Taxa Multa'],
      'Desconto':          ['Desc', 'Desconto (%)'],
      'Data de Emissão':   ['Dt Emissão', 'Emissão', 'Data Emissao'],
      'Vencimento':        ['Dt Vencimento', 'Data Vencimento', 'Dt Venc'],
      'Recebimento':       ['Dt Recebimento', 'Data Recebimento', 'Dt Rec'],
    },
  },
};

export const VALIDATORS: Record<CellRule, {
  test: (val: string) => boolean;
  label: string;
  numberAsTextLabel: string; // ← label específico por tipo de formatação
}> = {
  numbers: {
    test: (val: string) => {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) return true;
      const num = Number(trimmed);
      return Number.isFinite(num) && Number.isInteger(num) && num >= 0;
    },
    label: 'Apenas Números Inteiros',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Geral"',
  },
  date: {
    test: (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val.trim()),
    label: 'Data (AAAA-MM-DD)',
    numberAsTextLabel: '', // datas não geram erro de "número como texto"
  },
  currency: {
    test: (val: string) => /^\d+([.,]\d+)?$/.test(val.trim()),
    label: 'Moeda (sem R$)',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Moeda"',
  },
  binary: {
    test: (val: string) => /^[01]$/.test(val.trim()),
    label: 'Binário (0 ou 1)',
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
    label: 'Juros/Multa — até 3 dígitos inteiros e 2 decimais com vírgula (ex: 10,50). Formato: Geral',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Geral" (ex: 10,50)',
  },
  stock: {
    test: (val: string) => {
      const trimmed = val.trim();
      const num = Number(trimmed);
      return Number.isFinite(num) && Number.isInteger(num);
    },
    label: 'Quantidade (inteiro, pode ser negativo)',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Número" (inteiros, pode ser negativo)',
  },
  text: {
    test: (val: string) => val.trim().length > 0,
    label: 'Texto (formato Texto no Excel — preserva zeros à esquerda)',
    numberAsTextLabel: '', // colunas de texto não geram erro de "número como texto"
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