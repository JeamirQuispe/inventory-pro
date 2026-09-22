import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PackageOpen,
  Search,
  X,
} from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { errorMessage } from "../lib/api";
import type { Page } from "../lib/types";
export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
  variant,
  onOpenAutoFocus,
  busy = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  variant?: "confirmation";
  onOpenAutoFocus?: (event: Event) => void;
  busy?: boolean;
}) {
  const descriptionId = useId();
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal ${wide ? "modal-wide" : ""} ${variant === "confirmation" ? "modal-confirmation" : ""}`}
          onOpenAutoFocus={onOpenAutoFocus}
          aria-describedby={description ? descriptionId : undefined}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <header className="modal-header">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              {description && (
                <Dialog.Description id={descriptionId}>{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="icon-button"
                aria-label="Cerrar"
                title="Cerrar"
                disabled={busy}
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function PageHeading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </header>
  );
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={18} />
      <span>{errorMessage(error)}</span>
      {retry && (
        <button type="button" className="text-button" onClick={retry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div className="empty-state" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>Cargando datos…</span>
    </div>
  );
}
export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
}
export function DataTable<T extends { id: string }>({
  data,
  columns,
  empty = "No hay registros",
  loading = false,
}: {
  data: T[];
  columns: Column<T>[];
  empty?: string;
  loading?: boolean;
}) {
  if (loading) return <Loading />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!data.length && (
        <div className="empty-state">
          <PackageOpen size={30} />
          <strong>{empty}</strong>
        </div>
      )}
    </div>
  );
}
export function Pagination({
  result,
  onPage,
}: {
  result?: Page<unknown>;
  onPage: (page: number) => void;
}) {
  if (!result) return null;
  return (
    <footer className="pagination">
      <span>
        {result.total ? Math.min((result.page - 1) * result.pageSize + 1, result.total) : 0}–
        {Math.min(result.page * result.pageSize, result.total)} de {result.total} registros
      </span>
      <div>
        <button
          type="button"
          className="icon-button"
          title="Página anterior"
          aria-label="Página anterior"
          disabled={result.page <= 1}
          onClick={() => onPage(result.page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <span>
          Página {result.page} de {Math.max(result.totalPages, result.page)}
        </span>
        <button
          type="button"
          className="icon-button"
          title="Página siguiente"
          aria-label="Página siguiente"
          disabled={result.page >= result.totalPages}
          onClick={() => onPage(result.page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </footer>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        aria-label="Buscar registros"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className="icon-button"
          title="Limpiar búsqueda"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange("")}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
export function useDebounced<T>(value: T, delay = 300) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return result;
}
export function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  return (
    <span className={`badge ${stock === 0 ? "danger" : stock <= minStock ? "warning" : "success"}`}>
      {stock === 0 ? "Sin stock" : stock <= minStock ? "Stock bajo" : "Disponible"}
    </span>
  );
}
