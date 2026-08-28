import { getPeriods, getSettings } from '@/lib/queries';
import { rangoDePeriodo } from '@/lib/periods';
import { ConfiguracionForm } from './formulario';

// Siempre debe reflejar el estado actual de la configuración en la base.
export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const [settings, periodos] = await Promise.all([getSettings(), getPeriods()]);
  const rango = rangoDePeriodo(periodos);
  return (
    <div className="p-4">
      <ConfiguracionForm settingsIniciales={settings} inicioPeriodoActual={rango.inicio} />
    </div>
  );
}
