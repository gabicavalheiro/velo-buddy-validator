export type CellRule = 'numbers' | 'date' | 'currency' | 'binary';

export interface FileTypeConfig {
  label: string;
  skipRows: number;
  requiredColumns: string[];
  cellRules: Record<string, CellRule>;
  // Aliases: chave = nome canônico da coluna, valor = lista de nomes alternativos aceites
  columnAliases?: Record<string, string[]>;
  addressColumns?: string[];
  // Colunas que podem ter zeros à esquerda significativos (CPF, CNPJ, IE, CEST...)
  // Se estiverem com formatação numérica no Excel, os zeros serão perdidos na importação.
  leadingZeroColumns?: string[];
}

export const FILE_TYPES: Record<string, FileTypeConfig> = {
  clientes: {
    label: 'Clientes e Fornecedores',
    skipRows: 0,
    requiredColumns: ['Código', 'Nome/Razão Social', 'I.E', 'Simples Nacional', 'Cliente', 'Fornecedor'],
    cellRules: {
      'Código': 'numbers',
      'CPF/CNPJ': 'numbers',
      'I.E': 'numbers',
      'Telefone': 'numbers',
      'Celular': 'numbers',
      'Data Nascimento/Fundação': 'date',
      'Data Cadastro': 'date',
      'Simples Nacional': 'binary',
      'Cliente': 'binary',
      'Fornecedor': 'binary',
    },
    leadingZeroColumns: ['CPF/CNPJ', 'I.E'],
    columnAliases: {
      'Código':                   ['Cod', 'Cod.', 'codigo', 'Codigo'],
      'Nome/Razão Social':        ['Nome', 'Razão Social', 'Razao Social', 'nome'],
      'I.E':                      ['I.E.', 'IE', 'Inscrição Estadual', 'Inscricao Estadual', 'CNH', 'CNH/IE'],
      'CPF/CNPJ':                 ['CNPJ', 'CPF', 'CPF / CNPJ', 'cpf/cnpj', 'Cpf/Cnpj'],
      'Telefone':                 ['Tel', 'Tel.', 'Fone', 'telefone'],
      'Celular':                  ['Cel', 'Cel.', 'celular', 'WhatsApp'],
      'Data Nascimento/Fundação': ['Data Nascimento', 'Data Fundação', 'Nascimento', 'Fundação'],
      'Data Cadastro':            ['Dt Cadastro', 'Data de Cadastro'],
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
      'Código': 'numbers',
      'CEST': 'numbers',
      'Qtd. Estoque': 'numbers',
      'Preço Custo': 'currency',
      'Preço Venda': 'currency',
      'Data Cadastro': 'date',
      'Validade': 'date',
      'Ativo': 'binary',
      'Balança': 'binary',
    },
    leadingZeroColumns: ['CEST'],
    columnAliases: {
      'Código':               ['Cod', 'Cod.', 'codigo', 'Codigo'],
      'Descrição do produto': ['Descrição', 'Descricao', 'Desc', 'Produto'],
      'CEST':                 ['cest', 'Cest'],
      'Qtd. Estoque':         ['Qtd Estoque', 'Quantidade', 'Estoque', 'Qtd'],
      'Preço Custo':          ['Preco Custo', 'Custo', 'preco_custo'],
      'Preço Venda':          ['Preco Venda', 'Venda', 'preco_venda'],
      'Data Cadastro':        ['Dt Cadastro', 'Data de Cadastro'],
      'Validade':             ['Dt Validade', 'Data Validade', 'Vencimento'],
      'Ativo':                ['ativo', 'Status'],
      'Balança':              ['Balanca', 'balanca'],
    },
  },
  produtoGrade: {
    label: 'Produtos de Grade',
    skipRows: 0,
    requiredColumns: ['ProdutoId', 'EmpresaId'],
    cellRules: {
      'ProdutoId': 'numbers',
      'EmpresaId': 'numbers',
      'Qtd': 'numbers',
      'PrecoCusto': 'currency',
      'PrecoVenda': 'currency',
    },
    columnAliases: {
      'ProdutoId':  ['Produto Id', 'produto_id', 'ID Produto'],
      'EmpresaId':  ['Empresa Id', 'empresa_id', 'ID Empresa'],
      'Qtd':        ['Quantidade', 'Qtd.', 'qtd'],
      'PrecoCusto': ['Preço Custo', 'Preco Custo', 'preco_custo'],
      'PrecoVenda': ['Preço Venda', 'Preco Venda', 'preco_venda'],
    },
  },
  contasPagar: {
    label: 'Contas a Pagar',
    skipRows: 0,
    requiredColumns: ['Código da Pessoa', 'Código da Empresa', 'Valor'],
    cellRules: {
      'Código da Pessoa':   'numbers',
      'Código da Empresa':  'numbers',
      'Valor':              'currency',
      'Data da Emissão':    'date',
      'Data de Vencimento': 'date',
    },
    columnAliases: {
      'Código da Pessoa':   ['Cod Pessoa', 'CodPessoa', 'ID Pessoa'],
      'Código da Empresa':  ['Cod Empresa', 'CodEmpresa', 'ID Empresa'],
      'Valor':              ['Valor Total', 'Vl Total', 'Vl.'],
      'Data da Emissão':    ['Dt Emissão', 'Emissão', 'Data Emissao'],
      'Data de Vencimento': ['Dt Vencimento', 'Vencimento', 'Dt Venc'],
    },
  },
  contasReceber: {
    label: 'Contas a Receber',
    skipRows: 0,
    requiredColumns: ['Código da Pessoa', 'Código da Empresa', 'Valor em Aberto'],
    cellRules: {
      'Código da Pessoa':  'numbers',
      'Código da Empresa': 'numbers',
      'Valor em Aberto':   'currency',
      'Valor Quitado':     'currency',
      'Data de Emissão':   'date',
      'Vencimento':        'date',
      'Recebimento':       'date',
    },
    columnAliases: {
      'Código da Pessoa':  ['Cod Pessoa', 'CodPessoa', 'ID Pessoa'],
      'Código da Empresa': ['Cod Empresa', 'CodEmpresa', 'ID Empresa'],
      'Valor em Aberto':   ['Vl Aberto', 'Saldo', 'Valor Aberto'],
      'Valor Quitado':     ['Vl Quitado', 'Quitado', 'Valor Pago'],
      'Data de Emissão':   ['Dt Emissão', 'Emissão', 'Data Emissao'],
      'Vencimento':        ['Dt Vencimento', 'Data Vencimento', 'Dt Venc'],
      'Recebimento':       ['Dt Recebimento', 'Data Recebimento', 'Dt Rec'],
    },
  },
};

export const VALIDATORS: Record<CellRule, { test: (val: string) => boolean; label: string }> = {
  numbers: {
    // Aceita inteiros em qualquer formato do Excel:
    // - dígitos puros:            "123", "00456" (número armazenado como texto)
    // - número com ".0" do Excel: "123.0", "456.00" (formatação geral do Excel)
    test: (val: string) => {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) return true;
      const num = Number(trimmed);
      return Number.isFinite(num) && Number.isInteger(num) && num >= 0;
    },
    label: 'Apenas Números Inteiros',
  },
  date: {
    test: (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val.trim()),
    label: 'Data (AAAA-MM-DD)',
  },
  currency: {
    test: (val: string) => /^\d+([.,]\d+)?$/.test(val.trim()),
    label: 'Moeda (sem R$)',
  },
  binary: {
    test: (val: string) => /^[01]$/.test(val.trim()),
    label: 'Binário (0 ou 1)',
  },
};