import { Metadata } from 'next';
import ColorForm from '@/components/admin/color-form';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Crear Color',
};

export default async function CreateColorPage() {
  await requireAdmin();

  return (
    <div className='space-y-8 max-w-2xl mx-auto'>
      <h1 className='h2-bold'>Crear Color</h1>
      <p className='az-body-sm text-az-stone'>
        Definí un nombre y un valor hex. Quedará disponible para todos los
        productos al crear variantes de color.
      </p>
      <ColorForm type='Create' />
    </div>
  );
}
