import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Save } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { roleLabel } from "../../lib/format";
import { EntityPicker } from "../../components/EntityPicker";
import { Modal } from "../../components/ui";
import { CatalogField } from "./CatalogField";
import { catalogConfig, type CatalogKind, type CatalogRecord } from "./config";
import { useAuth } from "../auth/AuthProvider";
import type { Category } from "../../lib/types";

export function CatalogForm({
  kind,
  record,
  onClose,
  onSaved,
}: {
  kind: CatalogKind;
  record: CatalogRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const config = catalogConfig[kind];
  const client = useQueryClient();
  const { user } = useAuth();
  const [category, setCategory] = useState<Pick<Category, "id" | "name"> | null>(
    record?.category ?? null,
  );
  const [localError, setLocalError] = useState("");
  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api(`/${kind}${record ? `/${record.id}` : ""}`, {
        method: record ? "PUT" : "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      await client.invalidateQueries();
      onSaved();
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    setLocalError("");
    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = {};
    for (const field of config.fields) {
      const value = String(form.get(field.name) ?? "");
      if (field.name === "password" && !value && record) continue;
      data[field.name] = field.type === "number" ? Number(value) : value;
    }
    if (kind === "products") {
      if (!category) {
        setLocalError("Selecciona una categoría.");
        return;
      }
      data.categoryId = category.id;
    }
    if (kind === "users") {
      if (form.has("role")) data.role = form.get("role");
      if (record && user?.id !== record.id) data.isActive = form.get("isActive") === "on";
    }
    mutation.mutate(data);
  }
  return (
    <Modal
      title={`${record ? "Editar" : kind === "categories" ? "Nueva" : "Nuevo"} ${config.singular}`}
      busy={mutation.isPending}
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
    >
      <form onSubmit={submit} className="entity-form">
        {localError && (
          <div className="error-banner" role="alert">
            {localError}
          </div>
        )}
        <div className="form-grid">
          {config.fields.map((field) => (
            <label
              key={field.name}
              className={
                field.name === "description" || field.name === "address" ? "full-width" : ""
              }
            >
              {field.label}
              {field.name === "password" && record ? " (nueva, opcional)" : ""}
              <CatalogField
                field={field}
                initialValue={String(
                  record?.[field.name as keyof CatalogRecord] ??
                    (field.name === "minStock" ? 5 : ""),
                )}
                required={!!field.required || (field.name === "password" && !record)}
                onEdit={() => {
                  if (mutation.error) mutation.reset();
                }}
                serverError={
                  mutation.error instanceof ApiError
                    ? mutation.error.fields[field.name]?.join(". ")
                    : undefined
                }
              />
            </label>
          ))}
          {kind === "products" && (
            <EntityPicker<Category>
              label="Categoría"
              endpoint="categories"
              value={category}
              onChange={(value) => {
                setCategory(value);
                setLocalError("");
              }}
            />
          )}
          {kind === "users" && (
            <>
              <label>
                Rol
                <select
                  name="role"
                  defaultValue={record?.role ?? "SELLER"}
                  disabled={record?.id === user?.id}
                >
                  {Object.entries(roleLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {record && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={record.isActive}
                    disabled={record.id === user?.id}
                  />
                  Cuenta activa
                </label>
              )}
            </>
          )}
        </div>
        <footer className="form-actions">
          <button type="button" className="button" disabled={mutation.isPending} onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" disabled={mutation.isPending}>
            {mutation.isPending ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            Guardar
          </button>
        </footer>
      </form>
    </Modal>
  );
}
