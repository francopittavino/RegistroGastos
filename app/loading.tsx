export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"
        aria-hidden
      />
      <p className="text-sm text-muted">Cargando…</p>
    </div>
  );
}
