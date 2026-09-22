import { useId, useState } from "react";
import type { Field } from "./config";

export function CatalogField({
  field,
  initialValue,
  required,
  serverError,
  onEdit,
}: {
  field: Field;
  initialValue: string;
  required: boolean;
  serverError?: string;
  onEdit: () => void;
}) {
  const id = useId();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const phone = field.type === "tel";
  function validate(input: HTMLInputElement) {
    const text = field.type === "password" ? input.value : input.value.trim();
    let message = "";
    if (required && !text) message = "Completa este campo.";
    else if (phone && text && !/^[0-9]{9}$/.test(text))
      message = "El teléfono debe contener exactamente 9 dígitos.";
    else if (text && field.minLength && text.length < field.minLength)
      message = `Ingresa al menos ${field.minLength} caracteres.`;
    else if (field.type === "password" && new TextEncoder().encode(text).length > 72)
      message = "La contraseña no puede superar 72 bytes UTF-8.";
    input.setCustomValidity(message);
    return message || input.validationMessage;
  }
  const feedback = error || serverError;
  return (
    <>
      <input
        name={field.name}
        type={field.type || "text"}
        value={value}
        aria-label={field.label}
        required={required}
        min={field.min}
        max={field.max}
        step={field.step || (field.type === "number" ? "1" : undefined)}
        minLength={field.minLength}
        maxLength={field.maxLength}
        inputMode={phone ? "numeric" : undefined}
        pattern={phone ? "[0-9]{9}" : undefined}
        autoComplete={field.type === "password" ? "new-password" : phone ? "tel-national" : "off"}
        aria-invalid={!!feedback}
        aria-describedby={feedback ? id : undefined}
        onChange={(event) => {
          const input = event.currentTarget;
          onEdit();
          if (phone && !/^[0-9]{0,9}$/.test(input.value)) {
            setError("Solo se permiten dígitos, hasta un máximo de 9.");
            return;
          }
          setValue(input.value);
          const message = validate(input);
          setError(error ? message : "");
        }}
        onPaste={(event) => {
          if (!phone) return;
          const input = event.currentTarget;
          const pasted = event.clipboardData.getData("text");
          const next =
            value.slice(0, input.selectionStart ?? value.length) +
            pasted +
            value.slice(input.selectionEnd ?? value.length);
          if (!/^[0-9]{0,9}$/.test(next)) {
            event.preventDefault();
            setError("Pega solo dígitos, hasta un máximo de 9; sin código de país.");
          }
        }}
        onBlur={(event) => setError(validate(event.currentTarget))}
        onInvalid={(event) => setError(validate(event.currentTarget))}
      />
      {feedback && (
        <small id={id} className="field-error">
          {feedback}
        </small>
      )}
    </>
  );
}
