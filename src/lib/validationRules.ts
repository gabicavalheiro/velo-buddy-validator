export type CellRule = 'numbers' | 'date' | 'currency' | 'binary';

export interface FileTypeConfig {
  label: string;
  skipRows: number;
  requiredColumns: string[];
  cellRules: Record<string, CellRule>;
  addressColumns?: string[];
}

export const FILE_TYPES: Record<string, FileTypeConfig> = {
  clientes: {
    label: 'Clientes e Fornecedores',
    skipRows: 7,
    requiredColumns: ['Código', 'Nome/Razão Social', 'I.E', 'Simples Nacional', 'Cliente', 'Fornecedor'],
    cellRules: {
      'Código': 'numbers',
      'CPF/CNPJ': 'numbers',
      'Telefone': 'numbers',
      'Celular': 'numbers',
      'Data Nascimento/Fundação': 'date',
      'Data Cadastro': 'date',
      'Simples Nacional': 'binary',
      'Cliente': 'binary',
      'Fornecedor': 'binary',
    },
    addressColumns: ['CEP', 'Logradouro', 'Número', 'Bairro', 'Cidade', 'Estado', 'País'],
  },
  produtoSimples: {
    label: 'Produto Simples',
    skipRows: 6,
    requiredColumns: ['Código', 'Descrição do produto', 'Preço Venda', 'Ativo'],
    cellRules: {
      'Código': 'numbers',
      'Qtd. Estoque': 'numbers',
      'Preço Custo': 'currency',
      'Preço Venda': 'currency',
      'Data Cadastro': 'date',
      'Validade': 'date',
      'Ativo': 'binary',
      'Balança': 'binary',
    },
  },
  produtoGrade: {
    label: 'Produtos de Grade',
    skipRows: 5,
    requiredColumns: ['ProdutoId', 'EmpresaId'],
    cellRules: {
      'ProdutoId': 'numbers',
      'EmpresaId': 'numbers',
      'Qtd': 'numbers',
      'PrecoCusto': 'currency',
      'PrecoVenda': 'currency',
    },
  },
  contasPagar: {
    label: 'Contas a Pagar',
    skipRows: 7,
    requiredColumns: ['Código da Pessoa', 'Código da Empresa', 'Valor'],
    cellRules: {
      'Código da Pessoa': 'numbers',
      'Código da Empresa': 'numbers',
      'Valor': 'currency',
      'Data da Emissão': 'date',
      'Data de Vencimento': 'date',
    },
  },
  contasReceber: {
    label: 'Contas a Receber',
    skipRows: 9,
    requiredColumns: ['Código da Pessoa', 'Código da Empresa', 'Valor em Aberto'],
    cellRules: {
      'Código da Pessoa': 'numbers',
      'Código da Empresa': 'numbers',
      'Valor em Aberto': 'currency',
      'Valor Quitado': 'currency',
      'Data de Emissão': 'date',
      'Vencimento': 'date',
      'Recebimento': 'date',
    },
  },
};

export const VALIDATORS: Record<CellRule, { test: (val: string) => boolean; label: string }> = {
  numbers: {
    test: (val: string) => /^\d+$/.test(val.trim()),
    label: 'Apenas Números',
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
