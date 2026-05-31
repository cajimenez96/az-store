import { requireAdmin } from '@/lib/auth-guard';
import { getPromoCodeById } from '@/lib/actions/promo-code.actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PromoCodeForm from '@/components/admin/promo-code-form';

export const metadata: Metadata = {
  title: 'Editar Código Promocional',
};

export default async function EditDiscountCodePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  
  await requireAdmin();
  const promoCode = await getPromoCodeById(id);

  if (!promoCode) {
    notFound();
  }

  const formattedData = {
    ...promoCode,
    startsAt: promoCode.startsAt
      ? new Date(promoCode.startsAt).toISOString().slice(0, 16)
      : '',
    endsAt: promoCode.endsAt
      ? new Date(promoCode.endsAt).toISOString().slice(0, 16)
      : '',
  };

  return <PromoCodeForm initialData={formattedData} isEdit={true} />;
}
