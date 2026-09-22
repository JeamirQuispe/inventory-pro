import { useRef } from "react";
import { LoaderCircle } from "lucide-react";
import { Modal } from "./ui";

export function ConfirmDialog({
  title,
  description,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      title={title}
      description={description}
      variant="confirmation"
      busy={pending}
      onClose={() => {
        if (!pending) onCancel();
      }}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        cancel.current?.focus();
      }}
    >
      <footer className="confirmation-actions">
        <button ref={cancel} type="button" className="button" disabled={pending} onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="button destructive" disabled={pending} onClick={onConfirm}>
          {pending && <LoaderCircle className="spin" size={16} />}
          {pending ? "Desactivando…" : "Desactivar"}
        </button>
      </footer>
    </Modal>
  );
}
