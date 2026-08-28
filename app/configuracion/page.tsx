import { getCategoriesConUso, getPeriods, getSettings } from '@/lib/queries';
import { rangoDePeriodo } from '@/lib/periods';
import { ConfiguracionForm } from './formulario';
import { Categorias } from './categorias';

// Siempre debe reflejar el estado actual de la configuración en la base.
export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const [settings, periodos, categorias] = await Promise.all([
    getSettings(),
    getPeriods(),
    getCategoriesConUso(),
  ]);
  const rango = rangoDePeriodo(periodos);
  return (
    <div className="flex flex-col gap-6 p-4">
      <ConfiguracionForm settingsIniciales={settings} inicioPeriodoActual={rango.inicio} />
      <Categorias categoriasIniciales={categorias} />
    </div>
  );
}
