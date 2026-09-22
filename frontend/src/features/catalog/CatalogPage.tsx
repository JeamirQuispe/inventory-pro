import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { exportCsv, money, roleLabel } from "../../lib/format";
import type { Page } from "../../lib/types";
import {
  DataTable,
  ErrorState,
  PageHeading,
  Pagination,
  SearchInput,
  StockBadge,
  useDebounced,
  type Column,
} from "../../components/ui";
import { useAuth } from "../auth/AuthProvider";
import { CatalogForm } from "./CatalogForm";
import { catalogConfig, type CatalogKind, type CatalogRecord } from "./config";

export function CatalogPage({ kind }: { kind: CatalogKind }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const config = catalogConfig[kind];
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CatalogRecord | null | undefined>();
  const [removing, setRemoving] = useState<CatalogRecord | null>(null);
  const low = kind === "products" && params.get("lowStock") === "true";
  const result = useQuery({
    queryKey: [kind, q, page, low],
    queryFn: ({ signal }) =>
      api<Page<CatalogRecord>>(
        `/${kind}?q=${encodeURIComponent(q)}&page=${page}${low ? "&lowStock=true" : ""}`,
        { signal },
      ),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/${kind}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setRemoving(null);
      toast.success("Registro desactivado.");
      if (result.data?.data.length === 1 && page > 1) setPage(page - 1);
      await client.invalidateQueries();
    },
  });
  const canEdit = !!user && config.roles.includes(user.role);
  const columns: Column<CatalogRecord>[] = [
    {
      key: "name",
      label: kind === "products" ? "Producto" : "Nombre",
      render: (row) => (
        <div className="record-name">
          <span className={`record-avatar ${kind}`}>{row.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{row.name}</strong>
            {row.sku && <small>{row.sku}</small>}
          </div>
        </div>
      ),
    },
  ];
  if (kind === "products")
    columns.push(
      { key: "category", label: "Categoría", render: (row) => row.category?.name },
      {
        key: "price",
        label: "Precio",
        render: (row) => money(row.price ?? 0),
        className: "numeric",
      },
      {
        key: "stock",
        label: "Stock",
        render: (row) => (
          <strong>
            {row.stock} <small className="muted">uds.</small>
          </strong>
        ),
        className: "numeric",
      },
      {
        key: "status",
        label: "Estado",
        render: (row) => <StockBadge stock={row.stock ?? 0} minStock={row.minStock ?? 0} />,
      },
    );
  else if (kind === "categories")
    columns.push({
      key: "description",
      label: "Descripción",
      render: (row) => row.description || "—",
    });
  else if (kind === "users")
    columns.push(
      { key: "email", label: "Correo", render: (row) => row.email },
      { key: "role", label: "Rol", render: (row) => roleLabel[row.role ?? "SELLER"] },
      {
        key: "status",
        label: "Estado",
        render: (row) => (
          <span className={`badge ${row.isActive ? "success" : "neutral"}`}>
            {row.isActive ? "Activo" : "Inactivo"}
          </span>
        ),
      },
    );
  else
    columns.push(
      { key: "email", label: "Correo", render: (row) => row.email || "—" },
      { key: "phone", label: "Teléfono", render: (row) => row.phone || "—" },
      { key: "address", label: "Dirección", render: (row) => row.address || "—" },
    );
  if (canEdit)
    columns.push({
      key: "actions",
      label: "Acciones",
      className: "actions-column",
      render: (row) => (
        <div className="row-actions">
          <button
            className="icon-button"
            title={`Editar ${row.name}`}
            aria-label={`Editar ${row.name}`}
            onClick={() => setEditing(row)}
          >
            <Pencil size={16} />
          </button>
          {user?.role === "ADMIN" && row.id !== user.id && row.isActive !== false && (
            <button
              className="icon-button danger-text"
              title={`Desactivar ${row.name}`}
              aria-label={`Desactivar ${row.name}`}
              onClick={() => {
                remove.reset();
                setRemoving(row);
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    });
  return (
    <>
      <PageHeading title={config.title} subtitle={config.subtitle}>
        {canEdit && (
          <button className="button primary" onClick={() => setEditing(null)}>
            <Plus size={18} />
            {kind === "categories" ? "Nueva" : "Nuevo"} {config.singular}
          </button>
        )}
      </PageHeading>
      <div className="table-toolbar">
        <SearchInput
          value={search}
          onChange={(text) => {
            setSearch(text);
            setPage(1);
          }}
          placeholder={kind === "products" ? "Buscar por nombre o SKU…" : "Buscar por nombre…"}
        />
        <div className="toolbar-actions">
          {kind === "products" && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={low}
                onChange={(event) => {
                  setParams(event.target.checked ? { lowStock: "true" } : {});
                  setPage(1);
                }}
              />
              Stock bajo
            </label>
          )}
          <button
            className="icon-button bordered"
            title="Exportar página actual (CSV)"
            aria-label="Exportar página actual"
            disabled={!result.data?.data.length}
            onClick={() =>
              exportCsv(
                `${kind}-pagina-${page}.csv`,
                kind === "products"
                  ? ["Nombre", "SKU", "Categoría", "Precio", "Stock"]
                  : ["Nombre", "Correo", "Descripción"],
                (result.data?.data ?? []).map((row) =>
                  kind === "products"
                    ? [row.name, row.sku, row.category?.name, row.price, row.stock]
                    : [row.name, row.email, row.description],
                ),
              )
            }
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      {result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : (
        <>
          <DataTable
            data={result.data?.data ?? []}
            columns={columns}
            loading={result.isPending}
            empty={
              q || low
                ? "No se encontraron coincidencias"
                : `Todavía no hay ${config.title.toLowerCase()}`
            }
          />
          <Pagination result={result.data} onPage={setPage} />
        </>
      )}
      {editing !== undefined && (
        <CatalogForm
          kind={kind}
          record={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            toast.success("Cambios guardados correctamente.");
          }}
        />
      )}
      {removing && (
        <ConfirmDialog
          title={`Desactivar ${config.singular}`}
          description={`¿Desactivar "${removing.name}"? El historial se conservará.`}
          pending={remove.isPending}
          onCancel={() => setRemoving(null)}
          onConfirm={() => remove.mutate(removing.id)}
        />
      )}
    </>
  );
}
