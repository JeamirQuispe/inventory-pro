import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Eye, Plus } from "lucide-react";
import { api } from "../../lib/api";
import { dateTime, money } from "../../lib/format";
import type { Page, Transaction } from "../../lib/types";
import {
  DataTable,
  ErrorState,
  Modal,
  PageHeading,
  Pagination,
  SearchInput,
  useDebounced,
} from "../../components/ui";
import { TransactionForm } from "./TransactionForm";

export function TransactionsPage({ kind }: { kind: "sales" | "purchases" }) {
  const isSale = kind === "sales";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const result = useQuery({
    queryKey: [kind, q, page],
    queryFn: ({ signal }) =>
      api<Page<Transaction>>(`/${kind}?page=${page}&q=${encodeURIComponent(q)}`, { signal }),
  });
  return (
    <>
      <PageHeading
        title={isSale ? "Ventas" : "Compras"}
        subtitle={
          isSale
            ? "Salidas de productos e ingresos por ventas."
            : "Entradas de mercadería y abastecimiento."
        }
      >
        <button className="button primary" onClick={() => setCreating(true)}>
          <Plus size={18} />
          Nueva {isSale ? "venta" : "compra"}
        </button>
      </PageHeading>
      <div className="table-toolbar">
        <SearchInput
          value={search}
          onChange={(text) => {
            setSearch(text);
            setPage(1);
          }}
          placeholder={isSale ? "Buscar cliente o notas…" : "Buscar proveedor o notas…"}
        />
        <span className="muted">{result.data?.total ?? 0} operaciones</span>
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
                key: "id",
                label: "Referencia",
                render: (row) => (
                  <span className="reference">
                    {isSale ? "VTA" : "CMP"}-{row.id.slice(0, 8).toUpperCase()}
                  </span>
                ),
              },
              {
                key: "contact",
                label: isSale ? "Cliente" : "Proveedor",
                render: (row) => (
                  <strong>{(isSale ? row.customer : row.supplier)?.name ?? "Sin cliente"}</strong>
                ),
              },
              { key: "date", label: "Fecha", render: (row) => dateTime(row.createdAt) },
              { key: "user", label: "Registrado por", render: (row) => row.createdBy.name },
              {
                key: "total",
                label: "Total",
                render: (row) => <strong>{money(row.totalAmount)}</strong>,
                className: "numeric",
              },
              {
                key: "detail",
                label: "Detalle",
                render: (row) => (
                  <button
                    className="icon-button"
                    title="Ver detalle"
                    aria-label={`Ver detalle ${row.id.slice(0, 8)}`}
                    onClick={() => setDetail(row)}
                  >
                    <Eye size={18} />
                  </button>
                ),
              },
            ]}
          />
          <Pagination result={result.data} onPage={setPage} />
        </>
      )}
      {creating && (
        <TransactionForm
          kind={kind}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setPage(1);
            toast.success(`${isSale ? "Venta" : "Compra"} registrada. Inventario actualizado.`);
          }}
        />
      )}
      {detail && (
        <Modal
          title={`Detalle de ${isSale ? "venta" : "compra"}`}
          description={detail.id}
          wide
          onClose={() => setDetail(null)}
        >
          <div className="entity-form">
            <div className="transaction-summary">
              <span>
                {isSale ? "Cliente" : "Proveedor"}
                <strong>
                  {(isSale ? detail.customer : detail.supplier)?.name ?? "Sin cliente"}
                </strong>
              </span>
              <span>
                Fecha<strong>{dateTime(detail.createdAt)}</strong>
              </span>
            </div>
            <DataTable
              data={detail.items}
              columns={[
                { key: "product", label: "Producto", render: (row) => row.product.name },
                { key: "quantity", label: "Cantidad", render: (row) => row.quantity },
                {
                  key: "unit",
                  label: "Importe unitario",
                  render: (row) => money(row.unitPrice ?? row.unitCost ?? 0),
                },
                { key: "subtotal", label: "Subtotal", render: (row) => money(row.subtotal) },
              ]}
            />
            {detail.notes && <p>{detail.notes}</p>}
            <div className="transaction-total">
              <span>Total</span>
              <strong>{money(detail.totalAmount)}</strong>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
