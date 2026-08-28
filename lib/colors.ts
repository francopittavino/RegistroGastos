// Paleta categórica validada (orden fijo, nunca se ciclan los colores) — ver
// lib de dataviz. Valores de modo oscuro, porque la app no tiene modo claro.
export const PALETA_CATEGORICA = [
  '#3987e5', // azul
  '#d95926', // naranja
  '#199e70', // aqua
  '#c98500', // amarillo
  '#d55181', // magenta
  '#008300', // verde
  '#9085e9', // violeta
] as const;

export const COLOR_OTRAS = '#5a6472';

export interface Slice {
  nombre: string;
  monto: number;
  color: string;
}

/**
 * Asigna colores de la paleta categórica en orden fijo a las categorías con
 * más gasto. Si hay más de 7, el resto se pliega en una porción "Otras
 * categorías" con un gris neutro (nunca se genera un color nuevo).
 */
export function armarSlices(categorias: { categoryName: string; total: number }[]): Slice[] {
  const top = categorias.slice(0, PALETA_CATEGORICA.length);
  const resto = categorias.slice(PALETA_CATEGORICA.length);

  const slices: Slice[] = top.map((c, i) => ({
    nombre: c.categoryName,
    monto: c.total,
    color: PALETA_CATEGORICA[i],
  }));

  if (resto.length > 0) {
    slices.push({
      nombre: 'Otras categorías',
      monto: resto.reduce((acc, c) => acc + c.total, 0),
      color: COLOR_OTRAS,
    });
  }

  return slices;
}
