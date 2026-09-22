import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  CircleUserRound,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
  X,
  ArrowLeftRight,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { roleLabel } from "../lib/format";
import type { Role } from "../lib/types";

const all: Role[] = ["ADMIN", "WAREHOUSE", "SELLER"];
const inventory: Role[] = ["ADMIN", "WAREHOUSE"];
const navigation = [
  { path: "/", label: "Resumen", icon: LayoutDashboard, roles: inventory, section: "PRINCIPAL" },
  { path: "/products", label: "Productos", icon: Package, roles: all, section: "INVENTARIO" },
  { path: "/categories", label: "Categorías", icon: FolderTree, roles: all },
  { path: "/movements", label: "Movimientos", icon: ArrowLeftRight, roles: inventory },
  {
    path: "/purchases",
    label: "Compras",
    icon: ShoppingCart,
    roles: inventory,
    section: "OPERACIONES",
  },
  { path: "/sales", label: "Ventas", icon: Receipt, roles: ["ADMIN", "SELLER"] as Role[] },
  { path: "/suppliers", label: "Proveedores", icon: Truck, roles: inventory },
  { path: "/customers", label: "Clientes", icon: Users, roles: all },
  {
    path: "/reports",
    label: "Reportes",
    icon: BarChart3,
    roles: inventory,
    section: "ADMINISTRACIÓN",
  },
  { path: "/users", label: "Usuarios", icon: CircleUserRound, roles: ["ADMIN"] as Role[] },
];
export function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const sidebar = useRef<HTMLElement>(null);
  const [mobile, setMobile] = useState(() => matchMedia("(max-width: 800px)").matches);
  useEffect(() => {
    const media = matchMedia("(max-width: 800px)");
    const update = () => {
      setMobile(media.matches);
      if (!media.matches) setOpen(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(sidebar.current?.querySelectorAll<HTMLElement>("a, button") ?? []).filter(
        (element) => element.getClientRects().length,
      );
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [open, mobile]);
  const title = navigation.find((item) => item.path === location.pathname)?.label ?? "InventoryPro";
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Cerrar navegación"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebar}
        inert={mobile && !open}
        role={mobile && open ? "dialog" : undefined}
        aria-modal={mobile && open ? true : undefined}
        aria-label="Menú de InventoryPro"
        className={`sidebar ${open ? "is-open" : ""}`}
      >
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-icon">
            <Boxes size={23} />
          </span>
          Inventory<span>Pro</span>
        </NavLink>
        <button
          className="icon-button sidebar-close"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="workspace-label">
          <span className="workspace-mark">IP</span>
          <div>
            <strong>Mi negocio</strong>
            <small>Espacio de trabajo</small>
          </div>
        </div>
        <nav aria-label="Navegación principal">
          {navigation
            .filter((item) => user && item.roles.includes(user.role))
            .map((item) => (
              <div key={item.path}>
                {item.section && <span className="nav-section">{item.section}</span>}
                <NavLink to={item.path} end onClick={() => setOpen(false)}>
                  <item.icon size={19} />
                  <span>{item.label}</span>
                </NavLink>
              </div>
            ))}
        </nav>
        <footer className="sidebar-footer">
          <span className="avatar">{user?.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>{user && roleLabel[user.role]}</small>
          </div>
          <button
            className="icon-button"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={logout}
          >
            <LogOut size={18} />
          </button>
        </footer>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menú"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
            <span>Mi negocio</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <span className="role-indicator">
            <span />
            {user && roleLabel[user.role]}
          </span>
        </header>
        <main id="main-content" className="main-content" key={location.pathname} tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          InventoryPro<span>Gestión de inventario y ventas</span>
        </footer>
      </div>
    </div>
  );
}
