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
      <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 md:p-8 space-y-6 shadow-sm'>
        {/* Header */}
        <div className='space-y-1 border-b border-[#e5e5e5] pb-5'>
          <h1 className='font-marder-display font-medium text-3xl tracking-tight text-nike-ink'>
            Método de Pago
          </h1>
          <p className='text-sm text-[#757575]'>
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
                                'flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all duration-150',
                                isSelected
                                  ? 'border-nike-ink bg-[#f5f5f5]'
                                  : 'border-[#e5e5e5] bg-white hover:bg-[#fafafa]'
                              )}
                            >
                              <FormControl>
                                <RadioGroupItem
                                  id={`payment-${method}`}
                                  value={method}
                                  checked={isSelected}
                                  className={cn(
                                    'border-[#cacacb]',
                                    isSelected &&
                                      'border-nike-ink text-nike-ink'
                                  )}
                                />
                              </FormControl>
                              <span
                                className={cn(
                                  'text-sm font-medium flex-1 select-none',
                                  isSelected
                                    ? 'text-nike-ink font-semibold'
                                    : 'text-[#484848]'
                                )}
                              >
                                {DISPLAY_NAMES[method] ?? method}
                              </span>
                              {isSelected && (
                                <span className='text-xs text-nike-ink font-semibold bg-white border border-[#e5e5e5] px-2.5 py-1 rounded-full'>
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
              className='w-full h-12 rounded-full bg-nike-ink text-white hover:bg-black font-medium transition-colors'
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
