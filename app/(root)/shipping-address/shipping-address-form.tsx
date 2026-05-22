'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState } from 'react';
import { ShippingAddress } from '@/types';
import { shippingAddressSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
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
import { ArrowRight, Loader, Check, ChevronsUpDown } from 'lucide-react';
import { updateUserAddress } from '@/lib/actions/user.actions';
import provincias from '@/lib/data/argentina.json';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const ShippingAddressForm = ({ address }: { address: ShippingAddress }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [openProvince, setOpenProvince] = useState(false);

  const form = useForm<z.infer<typeof shippingAddressSchema>>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      fullName: address?.fullName ?? '',
      streetAddress: address?.streetAddress ?? '',
      city: address?.city ?? '',
      province: address?.province ?? '',
      postalCode: address?.postalCode ?? '',
      country: address?.country ?? 'Argentina',
      phone: address?.phone ?? '',
      apartment: address?.apartment ?? '',
      floor: address?.floor ?? '',
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
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='col-span-1 md:col-span-2'>
                <FormField
                  control={form.control}
                  name='fullName'
                  render={({ field }) => (
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
              </div>

              <div className='col-span-1 md:col-span-2'>
                <FormField
                  control={form.control}
                  name='streetAddress'
                  render={({ field }) => (
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
              </div>

              <FormField
                control={form.control}
                name='floor'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-sm font-medium text-black'>Piso (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ej: 2'
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
                name='apartment'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-sm font-medium text-black'>Depto (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ej: B'
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
                name='phone'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-sm font-medium text-black'>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ej: +54 9 11 1234-5678'
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
                render={({ field }) => (
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

              <FormField
                control={form.control}
                name='province'
                render={({ field }) => (
                  <FormItem className='flex flex-col mt-2'>
                    <FormLabel className='text-sm font-medium text-black mb-1'>Provincia</FormLabel>
                    <Popover open={openProvince} onOpenChange={setOpenProvince}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className={cn(
                              'w-full justify-between bg-white border-hairline-light text-black hover:bg-zinc-50',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? provincias.provinces.find((prov) => prov === field.value)
                              : 'Seleccionar provincia...'}
                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-full p-0 max-h-[300px] overflow-y-auto z-[9999] bg-white border-hairline-light' align="start">
                        <Command className='bg-transparent'>
                          <CommandInput placeholder='Buscar provincia...' className='border-none outline-none ring-0' />
                          <CommandList>
                            <CommandEmpty>No se encontró la provincia.</CommandEmpty>
                            <CommandGroup>
                              {provincias.provinces.map((prov) => (
                                <CommandItem
                                  value={prov}
                                  key={prov}
                                  onSelect={() => {
                                    form.setValue('province', prov);
                                    setOpenProvince(false);
                                  }}
                                  className='cursor-pointer text-black hover:bg-zinc-100'
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4 text-aloe-10',
                                      prov === field.value ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {prov}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='city'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-sm font-medium text-black'>Ciudad / Localidad</FormLabel>
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

              <div className='col-span-1 md:col-span-2'>
                <FormField
                  control={form.control}
                  name='country'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='text-sm font-medium text-black'>País</FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          placeholder='País'
                          className='bg-canvas-cream border-hairline-light rounded-md text-zinc-500 cursor-not-allowed'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
