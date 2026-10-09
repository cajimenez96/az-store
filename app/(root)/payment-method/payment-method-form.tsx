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
import { cn, formatCurrency } from '@/lib/utils';
import { paymentOptionTotals, type PriceComparisonInput } from '@/lib/pricing/payment-options';

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
  comparison = null,
}: {
  preferredPaymentMethod: string | null;
  userRole?: string;
  comparison?: PriceComparisonInput | null;
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

  const totals = paymentOptionTotals(comparison);
  const selectedMethod = form.watch('type');
  const selectedTotal =
    totals && selectedMethod in totals
      ? totals[selectedMethod as keyof typeof totals].total
      : null;

  return (
    <div className='max-w-xl mx-auto'>
      <div className='bg-white border border-nike-hairline-soft p-6 md:p-8 space-y-6'>
        {/* Header */}
        <div className='space-y-1 border-b border-nike-hairline-soft pb-5'>
          <h1 className='font-marder-display font-medium text-3xl tracking-tight text-nike-ink'>
            Método de Pago
          </h1>
          <p className='text-sm text-nike-mute'>
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
                        const option =
                          totals && method in totals
                            ? totals[method as keyof typeof totals]
                            : null;
                        const savings =
                          method === 'TransferenciaBancaria'
                            ? totals?.TransferenciaBancaria.savings
                            : null;
                        return (
                          <FormItem key={method} className='space-y-0'>
                            <FormLabel
                              htmlFor={`payment-${method}`}
                              className={cn(
                                'flex items-center gap-4 border p-4 min-h-14 cursor-pointer transition-colors duration-150',
                                isSelected
                                  ? 'border-nike-ink bg-nike-soft-cloud'
                                  : 'border-nike-hairline-soft bg-white'
                              )}
                            >
                              <FormControl>
                                <RadioGroupItem
                                  id={`payment-${method}`}
                                  value={method}
                                  checked={isSelected}
                                  className={cn(
                                    'border-nike-hairline',
                                    isSelected &&
                                      'border-nike-ink text-nike-ink'
                                  )}
                                />
                              </FormControl>
                              <span className='flex flex-1 flex-col gap-1 select-none'>
                                <span
                                  className={cn(
                                    'text-sm',
                                    isSelected
                                      ? 'text-nike-ink font-semibold'
                                      : 'text-nike-charcoal font-medium'
                                  )}
                                >
                                  {DISPLAY_NAMES[method] ?? method}
                                </span>
                                {savings && (
                                  <span className='inline-flex w-fit rounded-nike-lg bg-nike-soft-cloud px-2 py-0.5 text-xs font-medium text-nike-success'>
                                    Ahorrás {formatCurrency(savings.amount)} ·{' '}
                                    {savings.percent} %
                                  </span>
                                )}
                              </span>
                              {option && (
                                <span className='text-sm font-semibold text-nike-ink tabular-nums text-right'>
                                  {formatCurrency(option.total)}
                                </span>
                              )}
                              {isSelected && !option && (
                                <span className='text-xs text-nike-ink font-semibold bg-white border border-nike-hairline-soft px-2.5 py-1 rounded-nike-lg'>
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

            {selectedTotal !== null && (
              <div
                id='payment-summary'
                className='bg-nike-soft-cloud p-4 space-y-1'
              >
                <div className='flex justify-between items-baseline'>
                  <span className='text-sm text-nike-charcoal'>
                    Total de productos
                  </span>
                  <span className='text-xl font-medium text-nike-ink tabular-nums'>
                    {formatCurrency(selectedTotal)}
                  </span>
                </div>
                <p className='text-xs text-nike-mute'>
                  El cupón y el envío se calculan en el siguiente paso.
                </p>
              </div>
            )}

            <Button
              id='payment-submit'
              type='submit'
              className='w-full h-12 rounded-nike-lg bg-nike-ink text-white hover:bg-nike-charcoal font-medium transition-colors'
              disabled={isPending}
            >
              {isPending ? (
                <Loader className='w-4 h-4 animate-spin' />
              ) : (
                <span className='flex items-center justify-center gap-2'>
                  Continuar
                  <ArrowRight className='w-4 h-4' />
                </span>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PaymentMethodForm;
