import { armarSlices } from '@/lib/colors';
import { formatMonto } from '@/lib/format';

interface Props {
  categorias: { categoryName: string; total: number }[];
}

export function GraficoTorta({ categorias }: Props) {
  const slices = armarSlices(categorias);
  const total = slices.reduce((acc, s) => acc + s.monto, 0);

  if (total === 0) {
    return <p className="text-sm text-muted">Todavía no hay gastos este período.</p>;
  }

  let acumulado = 0;
  const stops = slices
    .map((s) => {
      const desde = (acumulado / total) * 360;
      acumulado += s.monto;
      const hasta = (acumulado / total) * 360;
      return `${s.color} ${desde}deg ${hasta}deg`;
    })
    .join(', ');

  return (
    <div className="flex items-center gap-4">
      <div
        role="img"
        aria-label="Gráfico de torta de gastos por categoría"
        className="h-28 w-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
      />
      <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
        {slices.map((s) => (
          <li key={s.nombre} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{s.nombre}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {formatMonto(s.monto)} · {Math.round((s.monto / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
