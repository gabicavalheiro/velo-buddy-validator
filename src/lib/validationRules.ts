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
  charLimits?: Record<string, number>;
}

export const FILE_TYPES: Record<string, FileTypeConfig> = {
  clientes: {
    label: 'Clientes e Fornecedores',
    skipRows: 0,
    requiredColumns: ['Código', 'Nome/Razão Social', 'Isento I.E', 'Simples Nacional', 'Cliente', 'Fornecedor'],
    cellRules: {
      'Código':                   'numbers',
      'CPF/CNPJ':                 'text',
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
      'Código': [
        'Cod', 'Cod.', 'codigo', 'Codigo', 'CODIGO', 'id', 'ID',
        'idpessoa', 'IdPessoa', 'id_pessoa', 'Cod Pessoa', 'CodPessoa',
      ],
      'Nome/Razão Social': [
        'Nome', 'NOME', 'Razão Social', 'Razao Social', 'RAZAO SOCIAL',
        'nome', 'Descricao', 'RazaoSocial', 'Nome Razao Social',
        'Nome/Razao Social', 'Nome / Razão Social',
      ],
      'Apelido': [
        'Nome Fantasia', 'NomeFantasia', 'Fantasia', 'FANTASIA',
        'apelido', 'APELIDO', 'Nome Comercial',
      ],
      'I.E': [
        'I.E.', 'IE', 'ie', 'Ie', 'IE.', 'Inscrição Estadual',
        'Inscricao Estadual', 'INSCRICAO ESTADUAL', 'CNH', 'CNH/IE',
        'Insc Estadual', 'InscEstadual',
      ],
      'Isento I.E': [
        'Isento IE', 'IsentoIE', 'Isento de IE', 'Isento de I.E',
        'Isento de I.E.', 'ISENTO IE', 'isento_ie', 'Isento',
      ],
      'CPF/CNPJ': [
        'CNPJ', 'CPF', 'CPF / CNPJ', 'cpf/cnpj', 'Cpf/Cnpj',
        'CPF_CNPJ', 'cpf_cnpj', 'CpfCnpj', 'Cpf Cnpj', 'CPF CNPJ',
        'Documento', 'Doc', 'DOCUMENTO',
      ],
      'Telefone': [
        'Tel', 'Tel.', 'TEL', 'Fone', 'FONE', 'telefone', 'TELEFONE',
        'Telefone Fixo', 'Fone Fixo', 'Fixo',
      ],
      'Celular': [
        'Cel', 'Cel.', 'CEL', 'celular', 'CELULAR', 'WhatsApp',
        'Whatsapp', 'WHATSAPP', 'Fone Cel', 'Tel Cel',
      ],
      'Data Nascimento/Fundação': [
        'Data Nascimento', 'Data Fundação', 'Nascimento', 'Fundação',
        'Dt Nascimento', 'Dt Fundacao', 'Dt Nasc',
        'Data Nasc', 'DataNascimento',
      ],
      'Data Cadastro': [
        'Dt Cadastro', 'Data de Cadastro', 'cadastro', 'CADASTRO',
        'Dt Cad', 'DtCadastro', 'DataCadastro',
      ],
      'Hora Cadastro': [
        'Hora', 'HORA', 'Hora Cad', 'Hr Cadastro', 'HrCadastro',
      ],
      'Simples Nacional': [
        'Simples', 'SN', 'sn', 'SimplesNacional', 'Simples Nac',
        'SIMPLES NACIONAL', 'Simples Nacional (0/1)',
      ],
      'Cliente':       ['cliente', 'CLIENTE', 'cli', 'Is Cliente', 'Eh Cliente'],
      'Fornecedor':    ['fornecedor', 'FORNECEDOR', 'forn', 'Is Fornecedor'],
      'Forn. Produto': [
        'Fornecedor Produto', 'Forn Produto', 'FornProduto',
        'Forn. de Produto', 'Fornecedor de Produto', 'Forn Prod',
      ],
      'Forn. Serviço': [
        'Fornecedor Servico', 'Forn Servico', 'FornServico',
        'Forn. de Serviço', 'Forn. Servico', 'Forn Serviço',
        'Fornecedor de Serviço', 'Fornecedor Serviço',
      ],
      'Forn. Transporte': [
        'Fornecedor Transporte', 'Forn Transporte', 'FornTransporte',
        'Forn. de Transporte', 'Fornecedor de Transporte', 'Forn Transp',
      ],
      'Observação': [
        'Obs', 'OBS', 'Observacao', 'obs', 'OBSERVACAO', 'OBSERVAÇÃO',
        'Notas', 'Nota', 'notas', 'nota',
      ],
    },
    addressColumns: ['CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro', 'Referência', 'Cidade', 'Estado'],
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
      'Código': [
        'Cod', 'Cod.', 'COD', 'codigo', 'Codigo', 'CODIGO', 'ID', 'id',
        'Cod Produto', 'CodProduto', 'Codigo Produto', 'CodigoProduto',
        'Cod. Produto', 'ID Produto',
      ],
      'Descrição do produto': [
        // Variações de capitalização
        'Descrição do Produto', 'Descricao do Produto', 'descricao do produto',
        'DESCRICAO DO PRODUTO', 'Descrição Do Produto',
        // Abreviações
        'Descrição', 'Descricao', 'DESCRICAO', 'Desc', 'DESC',
        // Sinônimos
        'Produto', 'PRODUTO', 'Nome', 'NOME', 'Nome Produto',
        'NomeProduto', 'Desc Produto', 'DescProduto',
        // Com ponto
        'Descr.', 'Desc.',
      ],
      'Preço Venda': [
        'Preco Venda', 'PRECO VENDA', 'PrecoVenda', 'preco_venda',
        'Preço de Venda', 'Preco de Venda', 'Vlr Venda', 'Valor Venda',
        'Venda', 'VENDA', 'Prç Venda', 'PVenda',
      ],
      'Ativo': [
        'ativo', 'ATIVO', 'Ativo?', 'Status', 'STATUS',
        'Situacao', 'Situação', 'SITUACAO', 'Ativo (0/1)',
        'Habilitado', 'Enabled', 'Activo',
      ],
      'CEST':  ['cest', 'CEST', 'Cest'],
      'NCM':   ['ncm', 'NCM', 'Ncm', 'Codigo NCM', 'Cod NCM', 'CodNCM'],
      'CSOSN': ['csosn', 'CSOSN', 'Csosn', 'CRT', 'crt', 'CRT/CSOSN'],
      'Qtd. Estoque': [
        'Qtd Estoque', 'QTD ESTOQUE', 'Qtd. Estoque', 'QtdEstoque',
        'Quantidade', 'QUANTIDADE', 'Estoque', 'ESTOQUE',
        'Qtd', 'QTD', 'Saldo', 'Saldo Estoque',
      ],
      'Preço Custo': [
        'Preco Custo', 'PRECO CUSTO', 'PrecoCusto', 'preco_custo',
        'Custo', 'CUSTO', 'Vlr Custo', 'Valor Custo', 'PCusto',
        'Preço de Custo', 'Preco de Custo',
      ],
      'Data Cadastro': [
        'Dt Cadastro', 'DT CADASTRO', 'Data de Cadastro', 'DataCadastro',
        'Dt Cad', 'cadastro',
      ],
      'Validade': [
        'Dt Validade', 'DT VALIDADE', 'Data Validade', 'Vencimento',
        'DataValidade', 'Dt Venc', 'Validade Produto',
      ],
      'Unidade': [
        'Unid', 'UNID', 'unidade', 'UNIDADE', 'Un', 'UN', 'UND', 'und',
        'Unid Medida', 'Unidade Medida',
      ],
      'Balança': ['Balanca', 'BALANCA', 'BALANÇA', 'balanca', 'balança'],
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
      'ProdutoId': [
        'Produto Id', 'produto_id', 'ID Produto', 'Id Produto',
        'Codigo Produto', 'CodigoProduto', 'Cod Produto', 'CodProduto',
        'Produto_Id', 'PRODUTOID', 'product_id', 'ProductId',
      ],
      'EmpresaId': [
        'Empresa Id', 'empresa_id', 'ID Empresa', 'Id Empresa',
        'Codigo Empresa', 'CodigoEmpresa', 'Cod Empresa', 'CodEmpresa',
        'Empresa_Id', 'EMPRESAID', 'company_id',
      ],
      'Qtd': [
        'Quantidade', 'QUANTIDADE', 'Qtd.', 'qtd', 'QTD',
        'Qtd Estoque', 'QtdEstoque', 'Saldo',
      ],
      'Estoque': [
        'Saldo Estoque', 'SaldoEstoque', 'Saldo', 'SALDO',
        'Estoque Atual', 'EstoqueAtual', 'ESTOQUE',
      ],
      'PrecoCusto': [
        'Preço Custo', 'Preco Custo', 'PRECO CUSTO', 'preco_custo',
        'Custo', 'CUSTO', 'Preco de Custo', 'Preço de Custo',
        'Vlr Custo', 'Valor Custo',
      ],
      'PrecoVenda': [
        'Preço Venda', 'Preco Venda', 'PRECO VENDA', 'preco_venda',
        'Venda', 'VENDA', 'Preco de Venda', 'Preço de Venda',
        'Vlr Venda', 'Valor Venda',
      ],
      'Margem': [
        'Margem (%)', 'Margem Lucro', 'margem', 'MARGEM',
        'Margem %', 'Margem Bruta', 'Markup',
      ],
      'Desconto': [
        'Desconto (%)', 'Desc', 'DESC', 'desconto', 'DESCONTO',
        'Desconto %', 'Vlr Desconto',
      ],
      'Unidade': [
        'Unid', 'UNID', 'unidade', 'UNIDADE', 'Un', 'UN', 'UND', 'und',
      ],
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
      'Código da Pessoa': [
        'Cod Pessoa', 'CodPessoa', 'ID Pessoa', 'PessoaId', 'Pessoa Id',
        'pessoa_id', 'CodigoPessoa', 'Codigo Pessoa', 'CODIGO PESSOA',
        'Cod. Pessoa', 'ID do Fornecedor', 'ID Fornecedor',
      ],
      'Código da Empresa': [
        'Cod Empresa', 'CodEmpresa', 'ID Empresa', 'EmpresaId', 'Empresa Id',
        'empresa_id', 'CodigoEmpresa', 'Codigo Empresa', 'CODIGO EMPRESA',
        'Cod. Empresa',
      ],
      'Valor': [
        'Valor Total', 'ValorTotal', 'Vl Total', 'VlTotal',
        'Vl.', 'VALOR', 'valor', 'Valor da Conta',
        'Valor Nominal', 'Vlr', 'VLR',
      ],
      'Carência': [
        'Carencia', 'CARENCIA', 'Dias Carência', 'Dias Carencia',
        'Carência (dias)', 'DiasCarencia',
      ],
      'Juros': [
        'Juros (%)', 'JUROS', 'juros', 'Taxa Juros', 'TaxaJuros',
        'Juro', 'Taxa de Juros',
      ],
      'Multa': [
        'Multa (%)', 'MULTA', 'multa', 'Taxa Multa', 'TaxaMulta',
        'Taxa de Multa',
      ],
      'Desconto': [
        'Desc', 'DESC', 'desconto', 'DESCONTO', 'Desconto (%)',
        'Vlr Desconto', 'Valor Desconto',
      ],
      'Data da Emissão': [
        'Dt Emissão', 'Dt Emissao', 'Emissão', 'Emissao', 'EMISSAO',
        'Data Emissao', 'DataEmissao', 'Data de Emissão', 'DtEmissao',
      ],
      'Data de Vencimento': [
        'Dt Vencimento', 'DtVencimento', 'Vencimento', 'VENCIMENTO',
        'Data Vencimento', 'DataVencimento', 'Dt Venc', 'DtVenc',
        'Dt. Vencimento',
      ],
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
      'Código da Pessoa': [
        'Cod Pessoa', 'CodPessoa', 'ID Pessoa', 'PessoaId', 'Pessoa Id',
        'pessoa_id', 'CodigoPessoa', 'Codigo Pessoa', 'CODIGO PESSOA',
        'Cod. Pessoa', 'ID Cliente', 'ID do Cliente',
      ],
      'Código da Empresa': [
        'Cod Empresa', 'CodEmpresa', 'ID Empresa', 'EmpresaId', 'Empresa Id',
        'empresa_id', 'CodigoEmpresa', 'Codigo Empresa', 'CODIGO EMPRESA',
      ],
      'Valor em Aberto': [
        'Vl Aberto', 'VlAberto', 'Saldo', 'SALDO', 'Valor Aberto',
        'ValorAberto', 'VALOR EM ABERTO', 'Saldo Devedor', 'Valor a Receber',
      ],
      'Valor Quitado': [
        'Vl Quitado', 'VlQuitado', 'Quitado', 'QUITADO',
        'Valor Pago', 'ValorPago', 'Pago',
      ],
      'Carência': [
        'Carencia', 'CARENCIA', 'Dias Carência', 'Dias Carencia',
        'Carência (dias)', 'DiasCarencia',
      ],
      'Juros':   ['Juros (%)', 'JUROS', 'juros', 'Taxa Juros', 'Juro'],
      'Multa':   ['Multa (%)', 'MULTA', 'multa', 'Taxa Multa'],
      'Desconto':['Desc', 'DESC', 'desconto', 'DESCONTO', 'Desconto (%)'],
      'Data de Emissão': [
        'Dt Emissão', 'Dt Emissao', 'Emissão', 'Emissao', 'EMISSAO',
        'Data Emissao', 'Data da Emissão', 'DtEmissao',
      ],
      'Vencimento': [
        'Dt Vencimento', 'DtVencimento', 'Data Vencimento', 'DataVencimento',
        'Dt Venc', 'DtVenc', 'Data de Vencimento',
      ],
      'Recebimento': [
        'Dt Recebimento', 'DtRecebimento', 'Data Recebimento',
        'DataRecebimento', 'Dt Rec', 'DtRec', 'Data de Recebimento',
      ],
    },
  },
};

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
    label: 'Apenas Números Inteiros',
    numberAsTextLabel: 'Número armazenado como texto — converta para Número e aplique o formato "Geral"',
  },
  date: {
    test: (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val.trim()),
    label: 'Data (AAAA-MM-DD)',
    numberAsTextLabel: '',
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