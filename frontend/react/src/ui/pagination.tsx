interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-4 text-sm">
      <button
        onClick={() => {
          onChange(page - 1);
        }}
        disabled={page <= 1}
        className="rounded border border-stone-300 px-3 py-1 disabled:text-stone-400"
      >
        Anterior
      </button>
      <span className="text-stone-600">
        Página {page} de {totalPages}
      </span>
      <button
        onClick={() => {
          onChange(page + 1);
        }}
        disabled={page >= totalPages}
        className="rounded border border-stone-300 px-3 py-1 disabled:text-stone-400"
      >
        Próxima
      </button>
    </nav>
  );
}
