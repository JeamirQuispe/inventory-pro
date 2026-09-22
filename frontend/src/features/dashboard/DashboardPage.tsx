import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Download,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { dateTime, exportCsv, money, movementLabel } from "../../lib/format";
import type { Dashboard } from "../../lib/types";
import { DataTable, ErrorState, Loading, PageHeading, StockBadge } from "../../components/ui";
import { useAuth } from "../auth/AuthProvider";

export function DashboardPage({ reports = false }: { reports?: boolean }) {
  const { user } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const params = new URLSearchParams();
  if (from) params.set("from", new Date(`${from}T00:00:00`).toISOString());
  if (to) params.set("to", new Date(`${to}T23:59:59.999`).toISOString());
  const invalid = !!from && !!to && from > to;
  const result = useQuery({
    queryKey: ["dashboard", from, to],
    queryFn: ({ signal }) => api<Dashboard>(`/reports/dashboard?${params}`, { signal }),
    enabled: !invalid,
  });
  const data = result.data;
  return (
    <>
      <PageHeading
        title={reports ? "Reportes" : "Resumen general"}
        subtitle={
          reports
            ? "Compras, ventas y actividad del período seleccionado."
            : `Bienvenido, ${user?.name.split(" ")[0]}. Así está tu inventario.`
        }
      >
        {reports ? (
          <button
            className="button"
            disabled={!data || invalid}
            onClick={() =>
              data &&
              exportCsv(
                "resumen-inventorypro.csv",
                ["Indicador", "Valor"],
                [
                  ["Desde", from || "Inicio"],
                  ["Hasta", to || "Hoy"],
                  ["Ventas", data.sales.totalAmount],
                  ["Compras", data.purchases.totalAmount],
                  ["Productos activos actuales", data.totals.products],
                  ["Productos actuales con stock bajo", data.lowStockCount],
                ],
              )
            }
          >
            <Download size={17} />
            Exportar resumen
          </button>
        ) : (
          <Link className="button" to="/reports">
            Ver reportes
            <ArrowUpRight size={17} />
          </Link>
        )}
      </PageHeading>
      {reports && (
        <div className="date-filters">
          <label>
            Desde
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          <button
            className="text-button"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Todo el historial
          </button>
        </div>
      )}
      {invalid ? (
        <div className="error-banner" role="alert">
          La fecha inicial no puede ser posterior a la final.
        </div>
      ) : result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : result.isPending ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="stats-grid">
              <article className="stat">
                <span className="stat-icon green">
                  <Boxes size={21} />
                </span>
                <span>Productos activos</span>
                <strong>{data.totals.products}</strong>
                <small>{data.totals.categories} categorías actuales</small>
              </article>
              <article className="stat">
                <span className="stat-icon blue">
                  <ArrowUpRight size={21} />
                </span>
                <span>Ventas {reports ? "del período" : "acumuladas"}</span>
                <strong>{money(data.sales.totalAmount)}</strong>
                <small>{data.sales.count} operaciones registradas</small>
              </article>
              <article className="stat">
                <span className="stat-icon violet">
                  <ArrowDownLeft size={21} />
                </span>
                <span>Compras {reports ? "del período" : "acumuladas"}</span>
                <strong>{money(data.purchases.totalAmount)}</strong>
                <small>{data.purchases.count} operaciones registradas</small>
              </article>
              <article className="stat">
                <span className="stat-icon amber">
                  <TriangleAlert size={21} />
                </span>
                <span>Stock bajo actual</span>
                <strong>{data.lowStockCount}</strong>
                <Link to="/products?lowStock=true">
                  Revisar productos
                  <ArrowRight size={13} />
                </Link>
              </article>
            </div>
            <div className="dashboard-grid">
              <section className="dashboard-section">
                <header className="section-heading">
                  <div>
                    <h2>Atención al inventario</h2>
                    <p>Productos en el mínimo o por debajo</p>
                  </div>
                  <Link to="/products?lowStock=true" className="text-link">
                    Ver todos
                    <ArrowRight size={15} />
                  </Link>
                </header>
                {data.lowStockProducts.length ? (
                  <div className="stock-list">
                    {data.lowStockProducts.slice(0, 6).map((product) => (
                      <div className="stock-row" key={product.id}>
                        <div className="stock-row-title">
                          <strong>{product.name}</strong>
                          <StockBadge stock={product.stock} minStock={product.minStock} />
                        </div>
                        <div className="stock-meter">
                          <span
                            style={{
                              width: `${Math.min(100, (product.stock / Math.max(1, product.minStock)) * 100)}%`,
                            }}
                          />
                        </div>
                        <small>
                          {product.stock} disponibles<span>Mínimo {product.minStock}</span>
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Boxes size={30} />
                    <strong>Inventario al día</strong>
                    <span>No hay productos con stock bajo.</span>
                  </div>
                )}
              </section>
              <section className="dashboard-section">
                <header className="section-heading">
                  <div>
                    <h2>Actividad reciente</h2>
                    <p>{reports ? "Movimientos del período" : "Últimos movimientos registrados"}</p>
                  </div>
                  <Link to="/movements" className="text-link">
                    Ver todos
                    <ArrowRight size={15} />
                  </Link>
                </header>
                <div className="activity-list">
                  {data.recentMovements.slice(0, 6).map((movement) => (
                    <div className="activity-item" key={movement.id}>
                      <span
                        className={`activity-icon ${movement.type === "SALE" ? "blue" : movement.type === "PURCHASE" ? "green" : "amber"}`}
                      >
                        {movement.type === "SALE" ? (
                          <ArrowUpRight size={18} />
                        ) : (
                          <ArrowDownLeft size={18} />
                        )}
                      </span>
                      <div>
                        <strong>{movement.product.name}</strong>
                        <small>
                          {movementLabel[movement.type]} · {dateTime(movement.createdAt)}
                        </small>
                      </div>
                      <strong
                        className={
                          movement.newStock >= movement.previousStock ? "positive" : "muted"
                        }
                      >
                        {movement.newStock > movement.previousStock ? "+" : ""}
                        {movement.newStock - movement.previousStock}
                      </strong>
                    </div>
                  ))}
                  {!data.recentMovements.length && (
                    <div className="empty-state">Sin movimientos registrados</div>
                  )}
                </div>
              </section>
            </div>
            {reports && (
              <section className="dashboard-section">
                <header className="section-heading">
                  <h2>Detalle de actividad</h2>
                </header>
                <DataTable
                  data={data.recentMovements}
                  columns={[
                    { key: "product", label: "Producto", render: (row) => row.product.name },
                    { key: "type", label: "Tipo", render: (row) => movementLabel[row.type] },
                    {
                      key: "stock",
                      label: "Stock anterior → nuevo",
                      render: (row) => `${row.previousStock} → ${row.newStock}`,
                    },
                    { key: "date", label: "Fecha", render: (row) => dateTime(row.createdAt) },
                  ]}
                />
              </section>
            )}
          </>
        )
      )}
    </>
  );
}
