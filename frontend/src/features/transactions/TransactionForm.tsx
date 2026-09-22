import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { money } from "../../lib/format";
import type { Contact, Product } from "../../lib/types";
import { EntityPicker } from "../../components/EntityPicker";
import { Modal } from "../../components/ui";

interface Line {
  product: Product;
  quantity: number;
  price: number;
}
export function TransactionForm({
  kind,
  onClose,
  onSaved,
}: {
  kind: "sales" | "purchases";
  onClose: () => void;
  onSaved: () => void;
}) {
  const isSale = kind === "sales";
  const client = useQueryClient();
  const [contact, setContact] = useState<Contact | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [review, setReview] = useState(false);
  const totalCents = lines.reduce(
    (sum, line) => sum + Math.round(line.price * 100) * line.quantity,
    0,
  );
  const mutation = useMutation({
    mutationFn: () =>
      api(`/${kind}`, {
        method: "POST",
        body: JSON.stringify({
          [isSale ? "customerId" : "supplierId"]: contact?.id,
          notes,
          items: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            [isSale ? "unitPrice" : "unitCost"]: line.price,
          })),
        }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries();
      onSaved();
    },
  });
  function add() {
    if (!selected) return;
    if (lines.some((line) => line.product.id === selected.id)) {
      toast.error("Este producto ya está en el detalle.");
      return;
    }
    if (isSale && selected.stock === 0) {
      toast.error("El producto no tiene stock disponible.");
      return;
    }
    setLines([...lines, { product: selected, quantity: 1, price: Number(selected.price) }]);
    setSelected(null);
  }
  function change(id: string, field: "quantity" | "price", value: number) {
    setLines(lines.map((line) => (line.product.id === id ? { ...line, [field]: value } : line)));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!isSale && !contact) {
      toast.error("Selecciona un proveedor.");
      return;
    }
    if (!lines.length) {
      toast.error("Agrega al menos un producto.");
      return;
    }
    if (isSale && lines.some((line) => line.quantity > line.product.stock)) {
      toast.error("La cantidad supera el stock disponible.");
      return;
    }
    if (totalCents > 9999999999) {
      toast.error("El total supera el importe máximo permitido.");
      return;
    }
    setReview(true);
  }
  return (
    <Modal
      title={
        review ? `Confirmar ${isSale ? "venta" : "compra"}` : `Nueva ${isSale ? "venta" : "compra"}`
      }
      wide
      busy={mutation.isPending}
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
    >
      <form className="entity-form" onSubmit={submit}>
        {review ? (
          <>
            <div className="transaction-summary">
              <span>
                {isSale ? "Cliente" : "Proveedor"}
                <strong>{contact?.name ?? "Venta sin cliente"}</strong>
              </span>
              <span>
                Productos<strong>{lines.length}</strong>
              </span>
              <span>
                Unidades<strong>{lines.reduce((sum, line) => sum + line.quantity, 0)}</strong>
              </span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.product.id}>
                      <td>{line.product.name}</td>
                      <td>{line.quantity}</td>
                      <td>{money((line.quantity * Math.round(line.price * 100)) / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {notes && <p className="muted">{notes}</p>}
            <p className="transaction-notice">
              {isSale
                ? "Esta venta descontará las unidades del inventario."
                : "Esta compra sumará las unidades al inventario."}{" "}
              La operación quedará registrada en el historial.
            </p>
          </>
        ) : (
          <>
            <EntityPicker<Contact>
              label={isSale ? "Cliente (opcional)" : "Proveedor"}
              endpoint={isSale ? "customers" : "suppliers"}
              value={contact}
              onChange={setContact}
              optional={isSale}
            />
            <div className="line-picker">
              <EntityPicker<Product>
                label="Producto"
                endpoint="products"
                value={selected}
                onChange={setSelected}
              />
              <button
                className="button"
                type="button"
                disabled={!selected || lines.length >= 100}
                onClick={add}
              >
                <Plus size={17} />
                Agregar
              </button>
            </div>
            <div className="line-items">
              {lines.map((line) => (
                <div className="line-item" key={line.product.id}>
                  <div className="line-name">
                    <strong>{line.product.name}</strong>
                    <small>
                      {line.product.sku} · {line.product.stock} disponibles
                    </small>
                  </div>
                  <label>
                    Cantidad
                    <input
                      aria-label={`Cantidad de ${line.product.name}`}
                      type="number"
                      min="1"
                      max={isSale ? Math.min(line.product.stock, 1000000) : 1000000}
                      step="1"
                      required
                      value={line.quantity || ""}
                      onChange={(event) =>
                        change(line.product.id, "quantity", Number(event.target.value))
                      }
                    />
                  </label>
                  <label>
                    {isSale ? "Precio" : "Costo"} (S/)
                    <input
                      aria-label={`${isSale ? "Precio" : "Costo"} de ${line.product.name}`}
                      type="number"
                      min="0.01"
                      max="99999999.99"
                      step="0.01"
                      required
                      value={line.price || ""}
                      onChange={(event) =>
                        change(line.product.id, "price", Number(event.target.value))
                      }
                    />
                  </label>
                  <strong className="line-subtotal">
                    {money((Math.round(line.price * 100) * line.quantity) / 100)}
                  </strong>
                  <button
                    type="button"
                    className="icon-button danger-text"
                    title={`Quitar ${line.product.name}`}
                    aria-label={`Quitar ${line.product.name}`}
                    onClick={() =>
                      setLines(lines.filter((entry) => entry.product.id !== line.product.id))
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <label>
              Notas (opcional)
              <textarea
                maxLength={255}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
              />
            </label>
          </>
        )}
        <div className="transaction-total">
          <span>Total</span>
          <strong>{money(totalCents / 100)}</strong>
        </div>
        <footer className="form-actions">
          {review ? (
            <>
              <button
                className="button"
                type="button"
                disabled={mutation.isPending}
                onClick={() => {
                  setReview(false);
                  mutation.reset();
                }}
              >
                <ArrowLeft size={17} />
                Volver
              </button>
              <button
                className="button primary"
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                <Check size={17} />
                {mutation.isPending ? "Registrando…" : `Confirmar ${isSale ? "venta" : "compra"}`}
              </button>
            </>
          ) : (
            <>
              <button className="button" type="button" onClick={onClose}>
                Cancelar
              </button>
              <button className="button primary" disabled={!lines.length}>
                Revisar {isSale ? "venta" : "compra"}
              </button>
            </>
          )}
        </footer>
      </form>
    </Modal>
  );
}
