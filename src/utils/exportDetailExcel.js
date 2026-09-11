import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const MONEY_FORMAT = '#,##0.00 [$€-es-ES]';

export async function exportDetailExcel({ sheetName, title, filename, columns, rows, totals }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ZagaPro";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  worksheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 28;

  worksheet.addRow([]);
  const header = worksheet.addRow(columns.map((column) => column.header));
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
  header.alignment = { vertical: "middle" };

  rows.forEach((item) => {
    const row = worksheet.addRow(columns.map((column) => column.value(item)));
    columns.forEach((column, index) => {
      if (column.money) row.getCell(index + 1).numFmt = MONEY_FORMAT;
    });
  });

  if (totals?.length) {
    const totalRow = worksheet.addRow(columns.map((_, index) => {
      const total = totals.find((item) => item.column === index);
      return total ? total.value : index === 0 ? "TOTAL" : "";
    }));
    totalRow.font = { bold: true };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    totals.forEach(({ column }) => {
      totalRow.getCell(column + 1).numFmt = MONEY_FORMAT;
    });
  }

  columns.forEach((column, index) => {
    worksheet.getColumn(index + 1).width = column.width || 18;
  });
  worksheet.views = [{ state: "frozen", ySplit: 3 }];
  worksheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  );
}
