import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import Loader from "../../../Components/Loader";
import { formatCurrency, formatDate } from "../utils/purchaseFormatters";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function inDateRange(value, from, to) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    if (date < start) return false;
  }

  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (date > end) return false;
  }

  return true;
}


function money(value) {
  return Number(value ?? 0) || 0;
}

function getProveedor(invoice) {
  return (
    invoice?.proveedor ||
    invoice?.proveedorNombre ||
    invoice?.ProveedorNombre ||
    "Proveedor no indicado"
  );
}

function getInvoiceBase(invoice) {
  const directBase = money(
    invoice?.base ??
    invoice?.tbase ??
    invoice?.Base ??
    invoice?.TBase ??
    invoice?.raw?.base ??
    invoice?.raw?.tbase ??
    invoice?.raw?.Base ??
    invoice?.raw?.TBase
  );

  if (directBase !== 0) return directBase;

  const total = getInvoiceTotal(invoice);
  const iva = getInvoiceIva(invoice);

  return money(total - iva);
}

function getInvoiceIva(invoice) {
  return money(invoice?.iva ?? invoice?.Iva);
}

function getInvoiceTotal(invoice) {
  return money(invoice?.total ?? invoice?.Total);
}

function getInvoicePagado(invoice) {
  return money(invoice?.importePagado ?? invoice?.ImportePagado);
}

function getInvoiceSaldo(invoice) {
  return money(invoice?.saldoPendiente ?? invoice?.SaldoPendiente);
}

function getInvoiceVatDetails(invoice) {
  return (
    invoice?.ivaDetalles ||
    invoice?.IvaDetalles ||
    invoice?.lineasIva ||
    invoice?.LineasIva ||
    invoice?.raw?.ivaDetalles ||
    invoice?.raw?.IvaDetalles ||
    invoice?.raw?.lineasIva ||
    invoice?.raw?.LineasIva ||
    []
  );
}

function getVatRate(invoice) {
  const base = getInvoiceBase(invoice);
  const iva = getInvoiceIva(invoice);

  if (base === 0) return iva === 0 ? 0 : null;

  const rate = Math.round(Math.abs(iva / base) * 100);
  return [0, 4, 10, 21].includes(rate) ? rate : null;
}

function getVatBuckets(invoice) {
  const buckets = {
    rate: null,
    base0: 0,
    base4: 0,
    iva4: 0,
    base10: 0,
    iva10: 0,
    base21: 0,
    iva21: 0,
    baseMixta: 0,
    ivaMixta: 0,
  };

  const detalles = getInvoiceVatDetails(invoice);

  if (Array.isArray(detalles) && detalles.length > 0) {
    detalles.forEach((d) => {
      const rate = money(d.ivaPct ?? d.IvaPct ?? d.tipoIva ?? d.TipoIva);
      const base = money(d.base ?? d.Base ?? d.tbase ?? d.TBase ?? d.baseImponible ?? d.BaseImponible);
      const iva = money(d.iva ?? d.Iva ?? d.cuota ?? d.Cuota ?? d.importeIva ?? d.ImporteIva);

      if (rate === 0) {
        buckets.base0 += base;
      } else if (rate === 4) {
        buckets.base4 += base;
        buckets.iva4 += iva;
      } else if (rate === 10) {
        buckets.base10 += base;
        buckets.iva10 += iva;
      } else if (rate === 21) {
        buckets.base21 += base;
        buckets.iva21 += iva;
      } else {
        buckets.baseMixta += base;
        buckets.ivaMixta += iva;
      }
    });

    const rates = [
      ...new Set(
        detalles.map((d) =>
          money(d.ivaPct ?? d.IvaPct ?? d.tipoIva ?? d.TipoIva),
        ),
      ),
    ];

    buckets.rate = rates.length === 1 ? rates[0] : null;
    return buckets;
  }

  const rate = getVatRate(invoice);
  const base = getInvoiceBase(invoice);
  const iva = getInvoiceIva(invoice);

  buckets.rate = rate;
  buckets.base0 = rate === 0 ? base : 0;
  buckets.base4 = rate === 4 ? base : 0;
  buckets.iva4 = rate === 4 ? iva : 0;
  buckets.base10 = rate === 10 ? base : 0;
  buckets.iva10 = rate === 10 ? iva : 0;
  buckets.base21 = rate === 21 ? base : 0;
  buckets.iva21 = rate === 21 ? iva : 0;
  buckets.baseMixta = rate === null ? base : 0;
  buckets.ivaMixta = rate === null ? iva : 0;

  return buckets;
}

export default function PurchaseBookPanel({
  supplierInvoices = [],
  loadingInvoices = false,
}) {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    estado: "",
    tipoDocumento: "",
    search: "",
  });

  const filteredInvoices = useMemo(() => {
    const query = normalizeText(filters.search);

    return supplierInvoices.filter((invoice) => {
      if (filters.from || filters.to) {
        if (!inDateRange(invoice.fecha, filters.from, filters.to)) return false;
      }

      if (filters.estado && invoice.estado !== filters.estado) return false;

      if (
        filters.tipoDocumento &&
        invoice.tipoDocumento !== filters.tipoDocumento
      ) {
        return false;
      }

      if (!query) return true;

      const haystack = normalizeText(
        [
          getProveedor(invoice),
          invoice.numeroFactura,
          invoice.referencia,
          invoice.descripcion,
          invoice.tipoDocumento,
          invoice.estado,
        ].join(" "),
      );

      return haystack.includes(query);
    });
  }, [filters, supplierInvoices]);

  const totals = filteredInvoices.reduce(
    (acc, invoice) => {
      const buckets = getVatBuckets(invoice);

      acc.base += getInvoiceBase(invoice);
      acc.iva += getInvoiceIva(invoice);
      acc.total += getInvoiceTotal(invoice);
      acc.pagado += getInvoicePagado(invoice);
      acc.saldo += getInvoiceSaldo(invoice);

      acc.base0 += buckets.base0;
      acc.base4 += buckets.base4;
      acc.iva4 += buckets.iva4;
      acc.base10 += buckets.base10;
      acc.iva10 += buckets.iva10;
      acc.base21 += buckets.base21;
      acc.iva21 += buckets.iva21;
      acc.baseMixta += buckets.baseMixta;
      acc.ivaMixta += buckets.ivaMixta;

      return acc;
    },
    {
      base: 0,
      iva: 0,
      total: 0,
      pagado: 0,
      saldo: 0,
      base0: 0,
      base4: 0,
      iva4: 0,
      base10: 0,
      iva10: 0,
      base21: 0,
      iva21: 0,
      baseMixta: 0,
      ivaMixta: 0,
    },
  );

  const estados = useMemo(
    () =>
      Array.from(
        new Set(supplierInvoices.map((item) => item.estado).filter(Boolean)),
      ),
    [supplierInvoices],
  );

  const tiposDocumento = useMemo(
    () =>
      Array.from(
        new Set(
          supplierInvoices.map((item) => item.tipoDocumento).filter(Boolean),
        ),
      ),
    [supplierInvoices],
  );

  const setFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

const exportExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Libro de compras", {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  worksheet.mergeCells("A1:R1");
  worksheet.getCell("A1").value = "LIBRO REGISTRO DE COMPRAS";
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.mergeCells("A2:R2");
  worksheet.getCell("A2").value = `Periodo: ${
    filters.from ? formatDate(filters.from) : "Inicio"
  } - ${filters.to ? formatDate(filters.to) : "Actualidad"}`;
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.mergeCells("A3:R3");
  worksheet.getCell("A3").value = `Fecha de exportación: ${formatDate(new Date())}`;
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  worksheet.addRow([]);

  const headers = [
    "Fecha",
    "Proveedor",
    "Documento",
    "Referencia",
    "Tipo IVA",
    "Base 0%",
    "Base 4%",
    "IVA 4%",
    "Base 10%",
    "IVA 10%",
    "Base 21%",
    "IVA 21%",
    "Base",
    "IVA",
    "Total",
    "Pagado",
    "Saldo",
    "Estado",
  ];

  const headerRow = worksheet.addRow(headers);

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF334155" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  filteredInvoices.forEach((invoice) => {
    const buckets = getVatBuckets(invoice);

    worksheet.addRow([
      formatDate(invoice.fecha),
      getProveedor(invoice),
      `${invoice.tipoDocumento || ""} ${invoice.numeroFactura || "-"}`,
      invoice.referencia || "-",
      buckets.rate === null ? "Mixto" : `${buckets.rate}%`,
      buckets.base0 || 0,
      buckets.base4 || 0,
      buckets.iva4 || 0,
      buckets.base10 || 0,
      buckets.iva10 || 0,
      buckets.base21 || 0,
      buckets.iva21 || 0,
      getInvoiceBase(invoice),
      getInvoiceIva(invoice),
      getInvoiceTotal(invoice),
      getInvoicePagado(invoice),
      getInvoiceSaldo(invoice),
      invoice.estado || "-",
    ]);
  });

  worksheet.addRow([]);

  const totalRow = worksheet.addRow([
    "",
    "",
    "",
    "",
    "TOTALES",
    totals.base0,
    totals.base4,
    totals.iva4,
    totals.base10,
    totals.iva10,
    totals.base21,
    totals.iva21,
    totals.base,
    totals.iva,
    totals.total,
    totals.pagado,
    totals.saldo,
    "",
  ]);

  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "double" },
    };
  });

  worksheet.columns = [
    { width: 12 },
    { width: 28 },
    { width: 22 },
    { width: 18 },
    { width: 10 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
  ];

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber >= 6 && colNumber <= 17 ? "right" : "left",
      };

      if (rowNumber > 5) {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      }

      if (colNumber >= 6 && colNumber <= 17 && typeof cell.value === "number") {
        cell.numFmt = '#,##0.00 €';
      }
    });
  });

  worksheet.views = [{ state: "frozen", ySplit: 5 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "libro-compras.xlsx");
};

  // const printBook = () => {
  //   window.print();
  // };

  return (
    <div className="purchase-book-print print-page space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Libro de compras
            </h3>
            <p className="text-sm text-slate-500">
              Registro fiscal de facturas recibidas, facturas simplificadas, rappels y abonos.
            </p>
          </div>

          <div className="no-print flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportExcel}
              disabled={filteredInvoices.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              <Download size={17} />
              Exportar Excel
            </button>

            {/* <button
              type="button"
              onClick={printBook}
              disabled={filteredInvoices.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <Printer size={17} />
              Imprimir
            </button> */}
          </div>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Desde
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilter("from", e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Hasta
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilter("to", e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Estado
          <select
            value={filters.estado}
            onChange={(e) => setFilter("estado", e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Tipo
          <select
            value={filters.tipoDocumento}
            onChange={(e) => setFilter("tipoDocumento", e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {tiposDocumento.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Buscar
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Proveedor, numero, referencia..."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <SummaryCard label="Base" value={formatCurrency(totals.base)} />
        <SummaryCard label="IVA" value={formatCurrency(totals.iva)} />
        <SummaryCard label="Total" value={formatCurrency(totals.total)} />
        <SummaryCard label="Pagado" value={formatCurrency(totals.pagado)} />
        <SummaryCard label="Saldo" value={formatCurrency(totals.saldo)} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white print:rounded-none print:border-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Referencia</th>
                <th className="px-4 py-3 text-left">IVA</th>
                <th className="px-4 py-3 text-right">Base 0%</th>
                <th className="px-4 py-3 text-right">Base 4%</th>
                <th className="px-4 py-3 text-right">IVA 4%</th>
                <th className="px-4 py-3 text-right">Base 10%</th>
                <th className="px-4 py-3 text-right">IVA 10%</th>
                <th className="px-4 py-3 text-right">Base 21%</th>
                <th className="px-4 py-3 text-right">IVA 21%</th>
                <th className="px-4 py-3 text-right">Base</th>
                <th className="px-4 py-3 text-right">IVA</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Pagado</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>

            <tbody>
              {loadingInvoices ? (
                <tr>
                  <td colSpan={18} className="px-4 py-10 text-center">
                    <Loader />
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No hay facturas para los filtros seleccionados.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const buckets = getVatBuckets(invoice);

                  return (
                    <tr
                      key={invoice.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">{formatDate(invoice.fecha)}</td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {getProveedor(invoice)}
                      </td>

                      <td className="px-4 py-3">
                        {invoice.tipoDocumento} {invoice.numeroFactura || "-"}
                      </td>

                      <td className="px-4 py-3">{invoice.referencia || "-"}</td>

                      <td className="px-4 py-3">
                        {buckets.rate === null ? "Mixto" : `${buckets.rate}%`}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {buckets.base0 ? formatCurrency(buckets.base0) : "-"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {buckets.base4 ? formatCurrency(buckets.base4) : "-"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {buckets.iva4 ? formatCurrency(buckets.iva4) : "-"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {buckets.base10 ? formatCurrency(buckets.base10) : "-"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {buckets.iva10 ? formatCurrency(buckets.iva10) : "-"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {buckets.base21 ? formatCurrency(buckets.base21) : "-"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {buckets.iva21 ? formatCurrency(buckets.iva21) : "-"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatCurrency(getInvoiceBase(invoice))}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatCurrency(getInvoiceIva(invoice))}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(getInvoiceTotal(invoice))}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatCurrency(getInvoicePagado(invoice))}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-amber-700">
                        {formatCurrency(getInvoiceSaldo(invoice))}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                          {invoice.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot className="bg-slate-50">
              <tr>
                <th
                  colSpan={5}
                  className="px-4 py-3 text-right font-bold text-slate-700"
                >
                  Totales
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.base0)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.base4)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.iva4)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.base10)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.iva10)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.base21)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.iva21)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.base)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.iva)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.total)}
                </th>
                <th className="px-4 py-3 text-right font-bold">
                  {formatCurrency(totals.pagado)}
                </th>
                <th className="px-4 py-3 text-right font-bold text-amber-700">
                  {formatCurrency(totals.saldo)}
                </th>
                <th></th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
