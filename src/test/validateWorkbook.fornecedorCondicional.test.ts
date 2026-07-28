import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { validateWorkbook } from "@/lib/validateFile";
import { FILE_TYPES } from "@/lib/validationRules";

const clientesConfig = FILE_TYPES.clientes;

function buildWorkbookFromRows(rows: any[][]) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  return workbook;
}

describe("validateWorkbook - clientes - Fornecedor condicional", () => {
  const header = [
    "Código", "Nome/Razão Social", "Isento I.E", "Simples Nacional",
    "Cliente", "Fornecedor", "Forn. Produto", "Forn. Serviço", "Forn. Transporte",
  ];

  it("Fornecedor=1 com todos os tipos vazios -> deve falhar e listar as 3 colunas", () => {
    const dataRow = ["1", "Empresa X", "1", "0", "0", "1", "", "", ""];
    const workbook = buildWorkbookFromRows([header, dataRow]);
    const result = validateWorkbook(workbook, clientesConfig);

    expect(result.success).toBe(false);
    const errs = result.cellErrors.filter(e => e.column.includes("tipo de fornecedor"));
    expect(errs.length).toBe(3);
  });

  it("Fornecedor=1 com apenas 1 dos 3 tipos preenchido -> deve listar exatamente as 2 colunas que faltaram", () => {
    const dataRow = ["1", "Empresa X", "1", "0", "0", "1", "1", "", ""];
    const workbook = buildWorkbookFromRows([header, dataRow]);
    const result = validateWorkbook(workbook, clientesConfig);

    const errs = result.cellErrors.filter(e => e.column.includes("tipo de fornecedor"));
    expect(errs.length).toBe(2);
    expect(errs.some(e => e.column.startsWith("Forn. Serviço"))).toBe(true);
    expect(errs.some(e => e.column.startsWith("Forn. Transporte"))).toBe(true);
    expect(errs.some(e => e.column.startsWith("Forn. Produto"))).toBe(false);
  });

  it("Fornecedor=1 com todos os 3 tipos preenchidos -> não deve gerar erro", () => {
    const dataRow = ["1", "Empresa X", "1", "0", "0", "1", "1", "0", "1"];
    const workbook = buildWorkbookFromRows([header, dataRow]);
    const result = validateWorkbook(workbook, clientesConfig);

    const errs = result.cellErrors.filter(e => e.column.includes("tipo de fornecedor"));
    expect(errs.length).toBe(0);
  });

  it("Fornecedor=0 -> não deve checar os tipos mesmo vazios", () => {
    const dataRow = ["1", "Empresa X", "1", "0", "1", "0", "", "", ""];
    const workbook = buildWorkbookFromRows([header, dataRow]);
    const result = validateWorkbook(workbook, clientesConfig);

    const errs = result.cellErrors.filter(e => e.column.includes("tipo de fornecedor"));
    expect(errs.length).toBe(0);
  });

  it("Cliente e Fornecedor vazios -> deve gerar erro de campo obrigatório", () => {
    const dataRow = ["1", "Empresa X", "1", "0", "", "", "", "", ""];
    const workbook = buildWorkbookFromRows([header, dataRow]);
    const result = validateWorkbook(workbook, clientesConfig);

    const errs = result.cellErrors.filter(e => e.column === "Cliente" || e.column === "Fornecedor");
    expect(errs.length).toBe(2);
  });
});
