// Define as configurações de cada tipo de ficheiro (colunas obrigatórias, linhas a ignorar e regras de validação das células).
export type CellRule = 'numbers' | 'date' | 'currency' | 'binary';

export interface FileTypeConfig {
  label: string;
  aliases?: string[];
  skipRows: number;
  requiredColumns: string[];
  /**
   * Permite aceitar nomes alternativos (sinónimos) para as colunas do Excel.
   * Chave: nome "canónico" (o que o sistema usa internamente).
   * Valor: lista de nomes alternativos que podem aparecer no ficheiro.
   */
  columnAliases?: Record<string, string[]>;
  /**
   * Colunas numéricas que devem estar realmente como número no Excel
   * (não podem estar com o aviso "número armazenado como texto").
   */
  strictNumericColumns?: string[];
  cellRules: Record<string, CellRule>;
  addressColumns?: string[];
}

export const FILE_TYPES: Record<string, FileTypeConfig> = {
  clientes: {
    label: 'Clientes e Fornecedores',
    aliases: ['Clientes', 'Fornecedores', 'Pessoas', 'Fornecedor', 'Cliente', 'Pessoa', 'Pessoa Jurídica', 'Pessoa Física'],
    // Cabeçalho na 1ª linha
    skipRows: 0,
    requiredColumns: ['Código', 'Nome/Razão Social', 'I.E', 'Simples Nacional', 'Cliente', 'Fornecedor'],
    columnAliases: {
      // Exemplos: ajuste conforme os nomes reais que os clientes usam
      'Código': ['Cod', 'Cód', 'Codigo', 'ID', 'Código do Cliente', 'Código Cliente'],
      'Nome/Razão Social': ['Nome', 'Razão Social', 'Razao Social', 'Nome/Razao Social', 'Nome Fantasia'],
      'I.E': ['IE', 'Inscrição Estadual', 'Inscricao Estadual', 'CNH', 'CNH/IE', 'CNH - IE'],
      'Simples Nacional': ['Simples', 'Optante Simples', 'Optante do Simples', 'SN'],
      'CPF/CNPJ': ['CPF', 'CNPJ', 'CPF / CNPJ', 'CPF-CNPJ', 'Documento'],
      'Telefone': ['Tel', 'Fone', 'Telefone 1'],
      'Celular': ['Cel', 'Telemóvel', 'Telefone 2', 'WhatsApp'],
      'Data Nascimento/Fundação': ['Data Nascimento', 'Data Fundação', 'Data Fundacao', 'Nascimento/Fundação'],
      'Data Cadastro': ['Cadastro', 'Data de Cadastro', 'Dt Cadastro'],
      'Cliente': ['É Cliente', 'Eh Cliente', 'Cliente?', 'Flag Cliente'],
      'Fornecedor': ['É Fornecedor', 'Eh Fornecedor', 'Fornecedor?', 'Flag Fornecedor'],

      // Morada / Endereço (campos condicionais em conjunto)
      'CEP': ['Código Postal', 'Codigo Postal', 'CP'],
      'Logradouro': ['Endereço', 'Endereco', 'Rua', 'Avenida', 'Av', 'Morada'],
      'Número': ['Numero', 'Nº', 'No', 'Nr', 'N'],
      'Complemento': ['Compl', 'Complemento Endereço', 'Complemento Endereco'],
      'Bairro': ['Distrito', 'Zona', 'Neighborhood'],
      'Referência': ['Referencia', 'Ponto de Referência', 'Ponto de Referencia'],
      'Cidade': ['Município', 'Municipio', 'Localidade'],
      'Estado': ['UF', 'Província', 'Provincia'],
    },
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
    // Campos de endereço: se qualquer um deles for preenchido, todos se tornam obrigatórios
    addressColumns: ['CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro', 'Referência', 'Cidade', 'Estado'],
    // Para estes campos queremos evitar "número armazenado como texto"
    strictNumericColumns: ['CPF/CNPJ', 'I.E'],
  },
  produtoSimples: {
    label: 'Produto Simples',
    aliases: ['Produto Simples', 'Produtos', 'Produtos Simples'],
    // Cabeçalho está na primeira linha da planilha de produtos
    skipRows: 0,
    requiredColumns: ['Código', 'Descrição do produto', 'Preço Venda', 'Ativo'],
    columnAliases: {
      'Código': ['Cod', 'Cód', 'Codigo', 'ID', 'Código do Produto', 'Código Produto', 'Cod Produto'],
      'Descrição do produto': [
        'Descrição',
        'Descriçao',
        'Descricao',
        'Descrição Produto',
        'Descriçao Produto',
        'Descricao Produto',
        'Nome',
        'Nome do Produto',
        'Produto',
      ],
      'Preço Venda': ['Preço de Venda', 'Preco Venda', 'Preco de Venda', 'PVenda', 'Preço', 'Preco'],
      'Ativo': ['É Ativo', 'Eh Ativo', 'Ativo?', 'Flag Ativo', 'Status', 'Situação', 'Situacao'],
      'Qtd. Estoque': ['Quantidade', 'Qtd Estoque', 'Qtd', 'Qtde Estoque', 'Estoque', 'QtdEstoque'],
      'Preço Custo': ['Preco Custo', 'Preço de Custo', 'Preco de Custo', 'PCusto'],
      'Data Cadastro': ['Cadastro', 'Data de Cadastro', 'Dt Cadastro', 'DataCad', 'DtCad'],
      'Validade': ['Data de Validade', 'Dt Validade', 'DataVal', 'DtVal'],
      'Balança': ['Balanca', 'Balança?', 'É Balança', 'Eh Balança', 'Flag Balança'],
    },
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
    aliases: ['Produtos de Grade', 'Produto Grade', 'Produtos Grade'],
    // Cabeçalho na 1ª linha
    skipRows: 0,
    requiredColumns: ['ProdutoId', 'EmpresaId'],
    columnAliases: {
      'ProdutoId': ['Produto Id', 'ID Produto', 'IdProduto', 'Código Produto', 'Cod Produto', 'Codigo Produto'],
      'EmpresaId': ['Empresa Id', 'ID Empresa', 'IdEmpresa', 'Código Empresa', 'Cod Empresa', 'Codigo Empresa'],
      'Qtd': ['Quantidade', 'Qtde', 'Qtd Estoque', 'Qtd Grade'],
      'PrecoCusto': ['Preço Custo', 'Preco Custo', 'Preço de Custo', 'Preco de Custo', 'PCusto'],
      'PrecoVenda': ['Preço Venda', 'Preco Venda', 'Preço de Venda', 'Preco de Venda', 'PVenda'],
    },
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
    aliases: ['Contas a Pagar', 'Contas Pagar', 'Contas', 'CPagar'],
    // Cabeçalho na 1ª linha
    skipRows: 0,
    requiredColumns: ['Código da Pessoa', 'Código da Empresa', 'Valor'],
    columnAliases: {
      'Código da Pessoa': ['Codigo da Pessoa', 'Cód Pessoa', 'Cod Pessoa', 'ID Pessoa', 'PessoaId', 'Pessoa Id', 'Código Cliente', 'Cod Cliente'],
      'Código da Empresa': ['Codigo da Empresa', 'Cód Empresa', 'Cod Empresa', 'ID Empresa', 'EmpresaId', 'Empresa Id'],
      'Valor': ['Valor Total', 'Valor da Parcela', 'Valor Título', 'ValorTitulo', 'Valor Documento', 'Valor Doc', 'Valor Original'],
      'Data da Emissão': ['Data Emissão', 'Data de Emissao', 'Data Emissao', 'Dt Emissão', 'Dt Emissao', 'Emissão', 'Emissao'],
      'Data de Vencimento': ['Data Vencimento', 'Dt Vencimento', 'Vencimento', 'Vcto', 'Data de Vcto'],
    },
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
    aliases: ['Contas a Receber', 'Contas Receber', 'CReceber'],
    // Cabeçalho na 1ª linha
    skipRows: 0,
    requiredColumns: ['Código da Pessoa', 'Código da Empresa', 'Valor em Aberto'],
    columnAliases: {
      'Código da Pessoa': ['Codigo da Pessoa', 'Cód Pessoa', 'Cod Pessoa', 'ID Pessoa', 'PessoaId', 'Pessoa Id', 'Código Cliente', 'Cod Cliente'],
      'Código da Empresa': ['Codigo da Empresa', 'Cód Empresa', 'Cod Empresa', 'ID Empresa', 'EmpresaId', 'Empresa Id'],
      'Valor em Aberto': ['Valor Aberto', 'Valor em aberto', 'Valor a Receber', 'Saldo Devedor', 'Saldo em Aberto'],
      'Valor Quitado': ['Valor Recebido', 'Valor Pago', 'ValorBaixado', 'Valor Baixado'],
      'Data de Emissão': ['Data Emissão', 'Data de Emissao', 'Data Emissao', 'Dt Emissão', 'Dt Emissao', 'Emissão', 'Emissao'],
      'Vencimento': ['Data de Vencimento', 'Data Vencimento', 'Dt Vencimento', 'Vcto', 'Data de Vcto'],
      'Recebimento': ['Data de Recebimento', 'Data Recebimento', 'Dt Recebimento', 'DtRecebimento', 'Recebido em'],
    },
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
