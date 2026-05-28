import { Metadata } from 'next';
import PromotionForm from '@/components/admin/promotion-form';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Crear Promoción',
};

export default async function CreatePromotionPage() {
  await requireAdmin();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="h2-bold">Crear Promoción</h1>
      <PromotionForm type="Create" />
    </div>
  );
}
