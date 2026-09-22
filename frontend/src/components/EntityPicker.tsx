import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Check } from "lucide-react";
import { api } from "../lib/api";
import type { Entity, Page } from "../lib/types";
import { ErrorState, Loading, Pagination, SearchInput, useDebounced } from "./ui";

export function EntityPicker<T extends Entity>({
  label,
  endpoint,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  endpoint: string;
  value: Pick<T, "id" | "name"> | null;
  onChange: (value: T | null) => void;
  optional?: boolean;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const result = useQuery({
    queryKey: [endpoint, "picker", q, page],
    queryFn: ({ signal }) =>
      api<Page<T>>(`/${endpoint}?q=${encodeURIComponent(q)}&page=${page}&pageSize=10`, { signal }),
    enabled: open,
  });
  function choose(item: T | null) {
    onChange(item);
    if (details.current) details.current.open = false;
  }
  return (
    <div className="picker">
      <span className="field-label">{label}</span>
      <details ref={details} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary aria-label={label}>
          <span>{value?.name || (optional ? "Sin seleccionar" : "Seleccionar")}</span>
          <ChevronDown size={16} />
        </summary>
        <div className="picker-menu">
          <SearchInput
            value={search}
            onChange={(text) => {
              setSearch(text);
              setPage(1);
            }}
          />
          {optional && (
            <button type="button" className="picker-option" onClick={() => choose(null)}>
              Sin seleccionar
            </button>
          )}
          {result.isPending ? (
            <Loading />
          ) : result.error ? (
            <ErrorState error={result.error} retry={() => void result.refetch()} />
          ) : (
            <>
              {result.data.data.map((item) => (
                <button
                  type="button"
                  className="picker-option"
                  key={item.id}
                  onClick={() => choose(item)}
                >
                  {item.name}
                  {item.id === value?.id && <Check size={16} />}
                </button>
              ))}
              {!result.data.total && <p className="muted">Sin resultados</p>}
              <Pagination result={result.data} onPage={setPage} />
            </>
          )}
        </div>
      </details>
    </div>
  );
}
