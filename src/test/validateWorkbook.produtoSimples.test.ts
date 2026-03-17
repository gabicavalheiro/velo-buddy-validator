import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";

import { validateWorkbook } from "@/lib/validateFile";
import { FILE_TYPES } from "@/lib/validationRules";

const produtoSimplesConfig = FILE_TYPES.produtoSimples;

function buildWorkbookFromRows(rows: any[][]) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  return workbook;
}

describe("validateWorkbook - produtoSimples", () => {
  it("deve retornar sucesso quando a planilha de produto simples está correta", () => {
    const header = [
      ...produtoSimplesConfig.requiredColumns,
      "Qtd. Estoque",
      "Preço Custo",
      "Data Cadastro",
      "Validade",
      "Balança",
    ];

    const dummyHeaderRows = Array.from({ length: produtoSimplesConfig.skipRows }, () => [] as any[]);

    const dataRow1 = [
      "123", // Código (numbers)
      "Produto Teste", // Descrição do produto
      "10.50", // Preço Venda (currency)
      "1", // Ativo (binary)
      "100", // Qtd. Estoque (numbers)
      "8.90", // Preço Custo (currency)
      "2024-01-01", // Data Cadastro (date)
      "2024-12-31", // Validade (date)
      "0", // Balança (binary)
    ];

    const rows = [...dummyHeaderRows, header, dataRow1];
    const workbook = buildWorkbookFromRows(rows);

    const result = validateWorkbook(workbook, produtoSimplesConfig);

    expect(result.success).toBe(true);
    expect(result.columnErrors).toHaveLength(0);
    expect(result.cellErrors).toHaveLength(0);
    expect(result.rowCount).toBe(1);
  });

  it("deve apontar coluna obrigatória em falta", () => {
    const headerWithoutAtivo = [
      "Código",
      "Descrição do produto",
      "Preço Venda",
      // falta "Ativo"
    ];

    const dummyHeaderRows = Array.from({ length: produtoSimplesConfig.skipRows }, () => [] as any[]);
    const dataRow1 = ["123", "Produto Teste", "10.50"];

    const rows = [...dummyHeaderRows, headerWithoutAtivo, dataRow1];
    const workbook = buildWorkbookFromRows(rows);

    const result = validateWorkbook(workbook, produtoSimplesConfig);

    expect(result.success).toBe(false);
    expect(result.columnErrors.some((e) => e.column === "Ativo")).toBe(true);
  });

  it("deve apontar erro de formato em células de moeda e binário", () => {
    const header = [
      ...produtoSimplesConfig.requiredColumns,
      "Qtd. Estoque",
      "Preço Custo",
      "Data Cadastro",
      "Validade",
      "Balança",
    ];

    const dummyHeaderRows = Array.from({ length: produtoSimplesConfig.skipRows }, () => [] as any[]);

    const badRow = [
      "ABC", // Código (deveria ser numbers)
      "Produto Inválido",
      "10,50,00", // Preço Venda (currency inválida)
      "2", // Ativo (binário inválido, deveria ser 0 ou 1)
      "estoque", // Qtd. Estoque (número inválido)
      "R$ 8,90", // Preço Custo (inclui símbolo, inválido para a regra)
      "01/01/2024", // Data Cadastro (formato errado, deveria ser AAAA-MM-DD)
      "31/12/2024", // Validade (formato errado)
      "sim", // Balança (binário inválido)
    ];

    const rows = [...dummyHeaderRows, header, badRow];
    const workbook = buildWorkbookFromRows(rows);

    const result = validateWorkbook(workbook, produtoSimplesConfig);

    expect(result.success).toBe(false);
    expect(result.cellErrors.length).toBeGreaterThan(0);
  });
}

