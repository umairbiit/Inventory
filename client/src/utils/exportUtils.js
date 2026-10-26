// CSV and Excel export helpers.
// columns: [{ title, value: (row) => any, width? }]

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportCSV = (filename, columns, rows) => {
  const lines = [columns.map((c) => csvCell(c.title)).join(",")];
  rows.forEach((r) => lines.push(columns.map((c) => csvCell(c.value(r))).join(",")));
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  download(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
};

// sheets: [{ name, columns, rows }]
export const exportExcel = async (filename, sheets) => {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const toCell = (v) => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return { value: v, type: Number };
    if (v instanceof Date) return { value: v, type: Date, format: "yyyy-mm-dd" };
    return { value: String(v), type: String };
  };
  const payload = sheets.map((s) => ({
    sheet: s.name.slice(0, 31),
    data: [
      s.columns.map((c) => ({ value: c.title, fontWeight: "bold" })),
      ...s.rows.map((r) => s.columns.map((c) => toCell(c.value(r)))),
    ],
    columns: s.columns.map((c) => ({ width: c.width || 16 })),
    stickyRowsCount: 1,
  }));
  await writeExcelFile(payload).toFile(filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
};
