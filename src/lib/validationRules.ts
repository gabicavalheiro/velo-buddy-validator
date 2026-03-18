export type CellRule =
  | 'numbers'
  | 'decimal'
  | 'date'
  | 'currency'
  | 'binary'
  | 'text_id'
  | 'text_flexible';

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
      // Tratado como TEXTO para preservar zeros à esquerda (ex: 000.123.456-09)
      'CPF/CNPJ': 'text_id',
      'Telefone': 'text_id',
      'Celular': 'text_id',
      'Data Nascimento/Fundação': 'date',
      'Data Cadastro': 'date',
      'Simples Nacional': 'binary',
      'Cliente': 'binary',
      'Fornecedor': 'binary',
    },
    // Endereço incompleto gera ALERTA (não erro) — sistema importa para Observações
    addressColumns: ['CEP', 'Logradouro', 'Número', 'Bairro', 'Cidade', 'Estado', 'País'],
  },

  produtoSimples: {
    label: 'Produto Simples',
    skipRows: 6,
    requiredColumns: ['Código', 'Descrição do produto', 'Preço Venda', 'Ativo'],
    cellRules: {
      'Código': 'numbers',
      // NCM: 8 dígitos com zeros à esquerda — NÃO pode virar número (ex: 01012100)
      'NCM': 'text_id',
      // EAN/GTIN pode começar com 0 — NÃO pode virar número
      'Código de Barras': 'text_id',
      // Aceita fracionado: clientes que vendem por peso/medida (ex: 1.5 kg, 0,750 L)
      'Qtd. Estoque': 'decimal',
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
      'Qtd': 'decimal',
      'PrecoCusto': 'currency',
      'PrecoVenda': 'currency',
    },
  },

  contasPagar: {
    label: 'Contas a Pagar',
    skipRows: 7,
    requiredColumns: ['Código da Pessoa', 'Código da Empresa', 'Valor'],
    cellRules: {
      // Apenas os campos críticos são validados; demais campos aceitos como texto livre
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
  // Apenas inteiros positivos
  numbers: {
    test: (val: string) => /^\d+$/.test(val.trim()),
    label: 'Apenas Números Inteiros',
  },
  // Inteiro ou decimal (vírgula ou ponto) — ex: 1 | 1.5 | 0,750
  decimal: {
    test: (val: string) => /^\d+([.,]\d+)?$/.test(val.trim()),
    label: 'Número (inteiro ou decimal)',
  },
  // Data ISO — funciona mesmo quando Excel lê célula como texto
  date: {
    test: (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val.trim()),
    label: 'Data (AAAA-MM-DD)',
  },
  // Valor monetário sem símbolo R$
  currency: {
    test: (val: string) => /^\d+([.,]\d+)?$/.test(val.trim()),
    label: 'Moeda (ex: 1234,56 — sem R$)',
  },
  // Campo 0 ou 1
  binary: {
    test: (val: string) => /^[01]$/.test(val.trim()),
    label: 'Binário (0 ou 1)',
  },
  // Identificador textual: dígitos + pontuação — preserva zeros à esquerda
  // Aceita: "000.123.456-09" | "01012100" | "0789462130045" | "(051)99999-9999"
  text_id: {
    test: (val: string) => /^[\d.\-\/\(\)\s]+$/.test(val.trim()),
    label: 'Identificador Texto (dígitos e pontuação)',
  },
  // Qualquer texto não-vazio (campos livres em contas)
  text_flexible: {
    test: (val: string) => val.trim().length > 0,
    label: 'Texto (qualquer valor preenchido)',
  },
};