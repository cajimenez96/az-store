import { Metadata } from 'next';
import ColorForm from '@/components/admin/color-form';
import { requireAdmin } from '@/lib/auth-guard';
import { getColorById } from '@/lib/actions/color.actions';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Editar Color',
};

export default async function UpdateColorPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await props.params;
  const color = await getColorById(id);

  if (!color) notFound();

  return (
    <div className='space-y-8 max-w-2xl mx-auto'>
      <h1 className='h2-bold'>Editar Color</h1>
      <ColorForm type='Update' color={color} />
    </div>
  );
}
