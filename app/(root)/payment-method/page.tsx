import { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserById } from '@/lib/actions/user.actions';
import PaymentMethodForm from './payment-method-form';
import { getMyCart } from '@/lib/actions/cart.actions';
import { getPriceComparison } from '@/lib/pricing/compare';
import CheckoutSteps from '@/components/shared/checkout-steps';

export const metadata: Metadata = {
  title: 'Seleccionar Método de Pago',
};

const PaymentMethodPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not found');

  const user = await getUserById(userId);

  // Informational only: a failed quote just hides the amounts, never the form.
  const cart = await getMyCart().catch(() => undefined);
  const comparison =
    cart && cart.items.length > 0
      ? await getPriceComparison(
          cart.items.map((item) => ({
            productId: item.productId,
            size: item.size,
            productColorId: item.productColorId,
            qty: item.qty,
          }))
        ).catch(() => null)
      : null;

  return (
    <>
      <CheckoutSteps current={2} />
      <PaymentMethodForm
        preferredPaymentMethod={user.paymentMethod}
        userRole={user.role}
        comparison={comparison}
      />
    </>
  );
};

export default PaymentMethodPage;
