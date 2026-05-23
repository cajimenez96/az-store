import { Metadata } from 'next';
import BrandForm from '@/components/admin/brand-form';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { getBrandById } from '@/lib/actions/brand.actions';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Editar Marca',
};

export default async function UpdateBrandPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminOrSeller();

  const { id } = await props.params;

  const brand = await getBrandById(id);

  if (!brand) notFound();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="h2-bold">Editar Marca</h1>
      <BrandForm type="Update" brand={brand} />
    </div>
  );
}
