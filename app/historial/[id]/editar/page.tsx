import { notFound } from 'next/navigation';
import { getCategories, getExpenseById } from '@/lib/queries';
import { FormularioGasto } from '@/app/components/formulario-gasto';

export default async function EditarGastoPage({ params }: PageProps<'/historial/[id]/editar'>) {
  const { id } = await params;
  const idNum = Number(id);
  if (Number.isNaN(idNum)) notFound();

  const [gasto, categorias] = await Promise.all([getExpenseById(idNum), getCategories()]);
  if (!gasto) notFound();

  return (
    <div className="p-4">
      <FormularioGasto categoriasIniciales={categorias} gastoExistente={gasto} />
    </div>
  );
}
