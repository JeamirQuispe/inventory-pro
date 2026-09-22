import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, Boxes, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { errorMessage } from "../../lib/api";
export function LoginPage() {
  const { user, login } = useAuth();
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      await login(String(data.get("email")), String(data.get("password")));
      toast.dismiss();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-panel">
        <a className="brand" href="/">
          <span className="brand-icon">
            <Boxes size={24} />
          </span>
          Inventory<span>Pro</span>
        </a>
        <form onSubmit={submit} className="login-form">
          <span className="eyebrow">TU ESPACIO DE TRABAJO</span>
          <h1>Iniciar sesión</h1>
          <p className="muted">Bienvenido de nuevo a InventoryPro.</p>
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="nombre@empresa.com"
              required
              autoFocus
            />
          </label>
          <label>
            Contraseña
            <span className="password-field">
              <input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="icon-button"
                aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <button className="button primary login-submit" disabled={pending}>
            {pending ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <>
                Entrar <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
        <small className="muted">InventoryPro · Gestión de inventario</small>
      </section>
      <section className="login-photo" aria-label="Almacén organizado">
        <div>
          <span className="eyebrow">INVENTORYPRO</span>
          <h2>
            Cada producto.
            <br />
            Cada movimiento.
          </h2>
          <p>Tu operación, bajo control.</p>
        </div>
      </section>
    </main>
  );
}
