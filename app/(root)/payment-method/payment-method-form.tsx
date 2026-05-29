'use client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { paymentMethodSchema } from '@/lib/validators';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from '@/lib/constants';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateUserPaymentMethod } from '@/lib/actions/user.actions';
import { cn } from '@/lib/utils';

const DISPLAY_NAMES: Record<string, string> = {
  MercadoPago: 'Mercado Pago (Online)',
  TransferenciaBancaria: 'Transferencia Bancaria',
  PuntoDeVenta_Efectivo: 'Punto de Venta — Efectivo',
  PuntoDeVenta_Transferencia: 'Punto de Venta — Transferencia',
  PuntoDeVenta_QR: 'Punto de Venta — QR',
  PuntoDeVenta_MercadoPago: 'Punto de Venta — Mercado Pago (Terminal)',
};

const PaymentMethodForm = ({
  preferredPaymentMethod,
  userRole,
}: {
  preferredPaymentMethod: string | null;
  userRole?: string;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: preferredPaymentMethod || DEFAULT_PAYMENT_METHOD,
    },
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit = async (values: z.infer<typeof paymentMethodSchema>) => {
    startTransition(async () => {
      const res = await updateUserPaymentMethod(values);

      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
        return;
      }

      router.push('/place-order');
    });
  };

  const visibleMethods = PAYMENT_METHODS.filter((method) => {
    if (method.startsWith('PuntoDeVenta')) {
      return userRole === 'admin' || userRole === 'seller';
    }
    return true;
  });

  return (
    <div className='max-w-xl mx-auto'>
      <div className='bg-az-canvas rounded-az-xxxl border border-az-hairline-soft p-6 md:p-8 space-y-6'>
        {/* Header */}
        <div className='space-y-1 border-b border-az-hairline-soft pb-5'>
          <h1 className='az-heading-sm text-az-ink-deep'>Método de Pago</h1>
          <p className='az-body-sm text-az-steel'>
            Seleccioná la opción que prefieras para realizar el pago de tu
            pedido.
          </p>
        </div>

        <Form {...form}>
          <form
            method='post'
            className='space-y-6'
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem className='space-y-3'>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className='flex flex-col gap-3'
                    >
                      {visibleMethods.map((method) => {
                        const isSelected = field.value === method;
                        return (
                          <FormItem key={method} className='space-y-0'>
                            <FormLabel
                              htmlFor={`payment-${method}`}
                              className={cn(
                                'flex items-center gap-4 rounded-az-xl border p-4 cursor-pointer transition-all duration-150',
                                isSelected
                                  ? 'border-az-primary bg-az-canvas shadow-sm'
                                  : 'border-az-hairline-soft bg-az-canvas hover:bg-az-surface-soft'
                              )}
                            >
                              <FormControl>
                                <RadioGroupItem
                                  id={`payment-${method}`}
                                  value={method}
                                  checked={isSelected}
                                  className={cn(
                                    'border-az-hairline',
                                    isSelected &&
                                      'border-az-primary text-az-primary'
                                  )}
                                />
                              </FormControl>
                              <span
                                className={cn(
                                  'az-body-sm-bold flex-1 select-none',
                                  isSelected
                                    ? 'text-az-ink-deep'
                                    : 'text-az-ink'
                                )}
                              >
                                {DISPLAY_NAMES[method] ?? method}
                              </span>
                              {isSelected && (
                                <span className='az-caption text-az-primary font-semibold'>
                                  Seleccionado
                                </span>
                              )}
                            </FormLabel>
                          </FormItem>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              id='payment-submit'
              type='submit'
              variant='buyCta'
              size='lg'
              className='w-full'
              disabled={isPending}
            >
              {isPending ? (
                <Loader className='w-4 h-4 animate-spin' />
              ) : (
                <>
                  Continuar
                  <ArrowRight className='w-4 h-4' />
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PaymentMethodForm;
