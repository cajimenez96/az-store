import { Metadata } from 'next';
import BrandForm from '@/components/admin/brand-form';
import { requireAdminOrSeller } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Crear Marca',
};

export default async function CreateBrandPage() {
  await requireAdminOrSeller();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="h2-bold">Crear Marca</h1>
      <BrandForm type="Create" />
    </div>
  );
}
