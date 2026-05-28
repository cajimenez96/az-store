import { Metadata } from 'next';
import PromotionForm from '@/components/admin/promotion-form';
import { requireAdmin } from '@/lib/auth-guard';
import { getPromotionById } from '@/lib/actions/promotion.actions';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Editar Promoción',
};

export default async function UpdatePromotionPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await props.params;

  const promotion = await getPromotionById(id);

  if (!promotion) notFound();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="h2-bold">Editar Promoción</h1>
      <PromotionForm type="Update" promotion={promotion} />
    </div>
  );
}
