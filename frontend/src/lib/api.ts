import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

let token = sessionStorage.getItem("inventorypro.token");
export const session = {
  get: () => token,
  set: (value: string | null) => {
    token = value;
    if (value) sessionStorage.setItem("inventorypro.token", value);
    else sessionStorage.removeItem("inventorypro.token");
  },
};
export class ApiError extends Error {
  status: number;
  fields: Record<string, string[]>;
  constructor(message: string, status: number, fields: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const requestToken = token;
  let response: Response;
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL || "/api"}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      "No se pudo conectar con el servidor. Revisa la conexión e inténtalo de nuevo.",
      0,
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response
    .json()
    .catch(() => ({ message: "El servidor devolvió una respuesta inesperada." }));
  if (!response.ok) {
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      requestToken &&
      session.get() === requestToken
    ) {
      session.set(null);
      toast.warning("Tu sesión terminó. Vuelve a iniciar sesión.", { id: "session-expired" });
      window.dispatchEvent(new Event("session-expired"));
    }
    throw new ApiError(
      body.message || "No se pudo completar la operación.",
      response.status,
      body.errors,
    );
  }
  return body as T;
}
export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (!(error instanceof ApiError && error.status === 401)) toast.error(errorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
      refetchOnWindowFocus: true,
    },
  },
});
const translations: Record<string, string> = {
  "Invalid credentials": "El correo o la contraseña no son correctos.",
  "Validation error": "Revisa los datos del formulario.",
  "Product SKU already exists": "Ya existe un producto con ese SKU.",
  "Category name already exists": "Ya existe una categoría con ese nombre.",
  "User email already exists": "Ya existe una cuenta con ese correo.",
  "Category has active products":
    "La categoría tiene productos activos. Reasígnalos antes de desactivarla.",
  "Supplier has purchases registered": "El proveedor tiene compras registradas y debe conservarse.",
  "Customer has sales registered": "El cliente tiene ventas registradas y debe conservarse.",
  "Adjust stock to zero before deactivating this product":
    "El producto todavía tiene stock. Registra la salida o un ajuste antes de desactivarlo.",
  "Stock is already at the requested quantity": "La cantidad indicada es igual al stock actual.",
  "Too many login attempts. Try again in 15 minutes":
    "Demasiados intentos. Vuelve a intentar en 15 minutos.",
  "Concurrent change detected. Please try again":
    "Otro usuario modificó el registro. Actualiza e inténtalo de nuevo.",
  "You cannot deactivate your own account": "No puedes desactivar tu propia cuenta.",
  "You cannot deactivate yourself or change your own role":
    "No puedes desactivar tu cuenta ni cambiar tu propio rol.",
};
export function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return "No se pudo completar la operación.";
  if (error.message.startsWith("Insufficient stock for "))
    return `Stock insuficiente para ${error.message.replace("Insufficient stock for ", "")}.`;
  return translations[error.message] ?? error.message;
}
