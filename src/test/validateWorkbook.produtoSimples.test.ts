// src/test/validateWorkbook.produtoSimples.test.ts
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
      "123",          // Código (numbers)
      "Produto Teste", // Descrição do produto
      "10,50",        // Preço Venda (currency — vírgula)
      "1",            // Ativo (binary)
      "100",          // Qtd. Estoque (stock)
      "8,90",         // Preço Custo (currency — vírgula)
      "2024-01-01",   // Data Cadastro (date)
      "30",           // Validade (numbers — dias após emissão da etiqueta)
      "0",            // Balança (binary)
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
    const dataRow1 = ["123", "Produto Teste", "10,50"];

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
      "ABC",          // Código (deveria ser numbers)
      "Produto Inválido",
      "10,50,00",     // Preço Venda (currency inválida)
      "2",            // Ativo (binário inválido, deveria ser 0 ou 1)
      "estoque",      // Qtd. Estoque (número inválido)
      "R$ 8,90",      // Preço Custo (inclui símbolo, inválido)
      "01/01/2024",   // Data Cadastro (formato errado, deveria ser AAAA-MM-DD)
      "trinta",       // Validade (texto inválido — deveria ser número inteiro de dias)
      "sim",          // Balança (binário inválido)
    ];

    const rows = [...dummyHeaderRows, header, badRow];
    const workbook = buildWorkbookFromRows(rows);

    const result = validateWorkbook(workbook, produtoSimplesConfig);

    expect(result.success).toBe(false);
    expect(result.cellErrors.length).toBeGreaterThan(0);
  });

  it("deve aceitar Validade como número inteiro de dias", () => {
    const header = [
      ...produtoSimplesConfig.requiredColumns,
      "Validade",
    ];

    const dummyHeaderRows = Array.from({ length: produtoSimplesConfig.skipRows }, () => [] as any[]);

    // Valores válidos: inteiros positivos representando dias
    const rows = [
      ...dummyHeaderRows,
      header,
      ["1", "Produto A", "10,00", "1", "7"],   // 7 dias
      ["2", "Produto B", "20,00", "1", "90"],   // 90 dias
      ["3", "Produto C", "30,00", "1", "365"],  // 365 dias
    ];

    const workbook = buildWorkbookFromRows(rows);
    const result = validateWorkbook(workbook, produtoSimplesConfig);

    expect(result.cellErrors.filter(e => e.column === "Validade")).toHaveLength(0);
  });

  it("deve rejeitar Validade como data no formato AAAA-MM-DD", () => {
    const header = [
      ...produtoSimplesConfig.requiredColumns,
      "Validade",
    ];

    const dummyHeaderRows = Array.from({ length: produtoSimplesConfig.skipRows }, () => [] as any[]);

    const rows = [
      ...dummyHeaderRows,
      header,
      ["1", "Produto A", "10,00", "1", "2024-12-31"], // data — inválida para este campo
    ];

    const workbook = buildWorkbookFromRows(rows);
    const result = validateWorkbook(workbook, produtoSimplesConfig);

    // "2024-12-31" falha como 'numbers' (contém hífens) → deve gerar erro
    expect(result.success).toBe(false);
    expect(result.cellErrors.some(e => e.column === "Validade")).toBe(true);
  });
});