'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { ShippingAddress } from '@/types';
import { shippingAddressSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { ControllerRenderProps, useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader } from 'lucide-react';
import { updateUserAddress } from '@/lib/actions/user.actions';

const ShippingAddressForm = ({ address }: { address: ShippingAddress }) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof shippingAddressSchema>>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      fullName: address?.fullName ?? '',
      streetAddress: address?.streetAddress ?? '',
      city: address?.city ?? '',
      postalCode: address?.postalCode ?? '',
      country: address?.country ?? '',
    },
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit: SubmitHandler<z.infer<typeof shippingAddressSchema>> = async (
    values
  ) => {
    startTransition(async () => {
      const res = await updateUserAddress(values);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
        return;
      }

      router.push('/payment-method');
    });
  };

  return (
    <div className='max-w-xl mx-auto px-4'>
      <div className='bg-white shadow-level-3 rounded-lg border-0 p-6 md:p-8 space-y-6'>
        <div className='space-y-2 border-b border-hairline-light pb-4'>
          <h1 className='font-display font-[330] text-2xl md:text-3xl text-black font-ss03'>
            Dirección de Envío
          </h1>
          <p className='text-xs text-zinc-500'>
            Por favor, ingresá los datos del destinatario y la dirección de entrega.
          </p>
        </div>

        <Form {...form}>
          <form
            method='post'
            className='space-y-5'
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name='fullName'
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof shippingAddressSchema>,
                  'fullName'
                >;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm font-medium text-black'>Nombre del Destinatario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Nombre completo de quien recibe'
                      className='bg-white border-hairline-light rounded-md text-black focus-visible:ring-black focus-visible:ring-offset-0'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='streetAddress'
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof shippingAddressSchema>,
                  'streetAddress'
                >;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm font-medium text-black'>Calle y Altura</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Dirección de entrega'
                      className='bg-white border-hairline-light rounded-md text-black focus-visible:ring-black focus-visible:ring-offset-0'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='city'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof shippingAddressSchema>,
                    'city'
                  >;
                }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-sm font-medium text-black'>Ciudad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ciudad / Localidad'
                        className='bg-white border-hairline-light rounded-md text-black focus-visible:ring-black focus-visible:ring-offset-0'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='postalCode'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof shippingAddressSchema>,
                    'postalCode'
                  >;
                }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-sm font-medium text-black'>Código Postal</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Código postal'
                        className='bg-white border-hairline-light rounded-md text-black focus-visible:ring-black focus-visible:ring-offset-0'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='country'
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof shippingAddressSchema>,
                  'country'
                >;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm font-medium text-black'>País</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='País'
                      className='bg-white border-hairline-light rounded-md text-black focus-visible:ring-black focus-visible:ring-offset-0'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              variant='primaryPill'
              size='lg'
              className='w-full mt-4'
              disabled={isPending}
            >
              {isPending ? (
                <Loader className='w-4 h-4 animate-spin' />
              ) : (
                <>
                  Continuar al pago
                  <ArrowRight className='w-4 h-4 ml-2' />
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ShippingAddressForm;
