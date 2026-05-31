'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Loader, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createOrder } from '@/lib/actions/order.actions';
import { useShippingMethod } from '@/hooks/use-shipping-method';

interface PlaceOrderFormProps {
  promoCode?: string;
  appliedDiscount?: number;
  bannerId?: string;
  bannerDiscount?: number;
}

const PlaceOrderForm = ({ promoCode, appliedDiscount, bannerId, bannerDiscount }: PlaceOrderFormProps) => {
  const router = useRouter();
  const { shippingMethod } = useShippingMethod();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await createOrder({
        shippingMethod,
        promoCode,
        appliedDiscount,
        bannerId,
        bannerDiscount,
      });

      if (res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res.success === false) {
        setError(res.message);
      }
    } catch (err) {
      setError('Ocurrió un error al procesar tu pedido. Intenta de nuevo.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className='w-full space-y-4'>
      {error && (
        <div className='flex items-start gap-2 bg-red-50 p-3 rounded-az-lg border border-red-200'>
          <AlertTriangle className='w-5 h-5 text-red-600 mt-0.5 flex-shrink-0' />
          <p className='az-body-sm text-red-800'>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className='w-full'>
        <Button disabled={pending} className='w-full' variant='buyCta' size='lg' data-testid='place-order-submit'>
          {pending ? (
            <Loader className='w-4 h-4 animate-spin mr-2' />
          ) : (
            <Check className='w-4 h-4 mr-2' />
          )}{' '}
          Realizar Pedido
        </Button>
      </form>
    </div>
  );
};

export default PlaceOrderForm;
