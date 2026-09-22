import { StrictMode, Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { App } from "./app/App";
import { AuthProvider } from "./features/auth/AuthProvider";
import { queryClient } from "./lib/api";
import "./styles.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }
  render() {
    return this.state.failed ? (
      <div className="fullscreen-state">
        <h1>No se pudo mostrar esta pantalla</h1>
        <button className="button primary" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              duration={4500}
              closeButton
              richColors
              containerAriaLabel="Notificaciones"
              toastOptions={{ closeButtonAriaLabel: "Cerrar notificación" }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
