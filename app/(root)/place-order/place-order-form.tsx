'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Loader, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createOrder } from '@/lib/actions/order.actions';
import { useShippingMethod } from '@/hooks/use-shipping-method';

interface PlaceOrderFormProps {
  promoCode?: string;
  bannerId?: string;
  bannerDiscount?: number;
}

const PlaceOrderForm = ({
  promoCode,
  bannerId,
  bannerDiscount,
}: PlaceOrderFormProps) => {
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
        bannerId,
        bannerDiscount,
      });

      if (res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res.success === false) {
        setError(res.message);
      }
    } catch {
      setError('Ocurrió un error al procesar tu pedido. Intenta de nuevo.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className='w-full space-y-4'>
      {error && (
        <div className='flex items-start gap-2 bg-red-50 p-3.5 rounded-xl border border-red-200/60'>
          <AlertTriangle className='w-4 h-4 text-red-600 mt-0.5 flex-shrink-0' />
          <p className='text-xs text-red-800 font-medium'>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className='w-full'>
        <Button
          type='submit'
          disabled={pending}
          className='w-full h-12 rounded-full bg-nike-ink text-white hover:bg-black font-medium transition-colors'
          data-testid='place-order-submit'
        >
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
