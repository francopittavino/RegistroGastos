import { getCategories } from '@/lib/queries';
import { FormularioGasto } from '@/app/components/formulario-gasto';

// La fecha por defecto del formulario es "hoy": no se puede prerenderizar como estática.
export const dynamic = 'force-dynamic';

export default async function NuevoGastoPage() {
  const categorias = await getCategories();
  return (
    <div className="p-4">
      <FormularioGasto categoriasIniciales={categorias} />
    </div>
  );
}
