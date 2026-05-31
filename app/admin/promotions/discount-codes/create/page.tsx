import { requireAdmin } from '@/lib/auth-guard';
import { Metadata } from 'next';
import PromoCodeForm from '@/components/admin/promo-code-form';

export const metadata: Metadata = {
  title: 'Crear Código Promocional',
};

export default async function CreatePromoCodePage() {
  await requireAdmin();

  return <PromoCodeForm />;
}
