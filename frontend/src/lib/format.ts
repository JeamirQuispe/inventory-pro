export const money = (value: string | number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value));
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
export const roleLabel = { ADMIN: "Administrador", WAREHOUSE: "Almacén", SELLER: "Vendedor" };
export const movementLabel = { PURCHASE: "Compra", SALE: "Venta", ADJUSTMENT: "Ajuste" };
export function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const blob = new Blob(
    ["\uFEFF", [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
