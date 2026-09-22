import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "../../lib/api";
import { dateTime, movementLabel } from "../../lib/format";
import type { Movement, Page, Product } from "../../lib/types";
import {
  DataTable,
  ErrorState,
  Modal,
  PageHeading,
  Pagination,
  SearchInput,
  useDebounced,
} from "../../components/ui";
import { EntityPicker } from "../../components/EntityPicker";

export function MovementsPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const result = useQuery({
    queryKey: ["stock-movements", q, page],
    queryFn: ({ signal }) =>
      api<Page<Movement>>(`/stock-movements?page=${page}&q=${encodeURIComponent(q)}`, { signal }),
  });
  const mutation = useMutation({
    mutationFn: (data: unknown) =>
      api("/stock-movements/adjustments", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: async () => {
      setOpen(false);
      toast.success("Ajuste registrado. Inventario actualizado.");
      await client.invalidateQueries();
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!product) {
      toast.error("Selecciona un producto.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    if (reason.length < 3) {
      toast.error("Escribe un motivo de al menos 3 caracteres, no solo espacios.");
      return;
    }
    mutation.mutate({
      productId: product.id,
      newStock: Number(form.get("newStock")),
      reason,
    });
  }
  return (
    <>
      <PageHeading
        title="Movimientos"
        subtitle="Trazabilidad de cada entrada, salida y ajuste de stock."
      >
        <button
          className="button primary"
          onClick={() => {
            setProduct(null);
            mutation.reset();
            setOpen(true);
          }}
        >
          <Plus size={18} />
          Ajustar stock
        </button>
      </PageHeading>
      <div className="table-toolbar">
        <SearchInput
          value={search}
          onChange={(text) => {
            setSearch(text);
            setPage(1);
          }}
          placeholder="Buscar producto…"
        />
      </div>
      {result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : (
        <>
          <DataTable
            data={result.data?.data ?? []}
            loading={result.isPending}
            columns={[
              {
                key: "product",
                label: "Producto",
                render: (row) => (
                  <div>
                    <strong>{row.product.name}</strong>
                    <small className="block muted">{row.product.sku}</small>
                  </div>
                ),
              },
              {
                key: "type",
                label: "Movimiento",
                render: (row) => (
                  <span
                    className={`badge ${row.type === "PURCHASE" ? "success" : row.type === "SALE" ? "info" : "warning"}`}
                  >
                    {movementLabel[row.type]}
                  </span>
                ),
              },
              {
                key: "quantity",
                label: "Variación",
                render: (row) => (
                  <strong
                    className={row.newStock >= row.previousStock ? "positive" : "danger-text"}
                  >
                    {row.newStock > row.previousStock ? "+" : ""}
                    {row.newStock - row.previousStock}
                  </strong>
                ),
              },
              {
                key: "stock",
                label: "Stock anterior → nuevo",
                render: (row) => `${row.previousStock} → ${row.newStock}`,
              },
              {
                key: "reason",
                label: "Motivo",
                render: (row) => <span className="movement-reason">{row.reason || "—"}</span>,
              },
              {
                key: "user",
                label: "Responsable / fecha",
                render: (row) => (
                  <div>
                    {row.createdBy.name}
                    <small className="block muted">{dateTime(row.createdAt)}</small>
                  </div>
                ),
              },
            ]}
          />
          <Pagination result={result.data} onPage={setPage} />
        </>
      )}
      {open && (
        <Modal
          title="Ajustar stock"
          busy={mutation.isPending}
          onClose={() => {
            if (!mutation.isPending) setOpen(false);
          }}
        >
          <form className="entity-form" onSubmit={submit}>
            <EntityPicker<Product>
              label="Producto"
              endpoint="products"
              value={product}
              onChange={setProduct}
            />
            {product && (
              <p className="stock-current">
                Stock actual: <strong>{product.stock} unidades</strong>
              </p>
            )}
            <label>
              Stock contado
              <input name="newStock" type="number" min="0" max="2147483647" step="1" required />
            </label>
            <label>
              Motivo del ajuste
              <textarea name="reason" minLength={3} maxLength={255} required rows={3} />
            </label>
            <footer className="form-actions">
              <button
                className="button"
                type="button"
                disabled={mutation.isPending}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button className="button primary" disabled={mutation.isPending || !product}>
                Confirmar ajuste
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}
