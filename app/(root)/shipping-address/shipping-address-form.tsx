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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

const inputClass =
  'bg-az-canvas border-az-hairline-soft rounded-az-lg text-az-ink placeholder:text-az-stone focus-visible:ring-az-primary focus-visible:ring-offset-0 h-11';
const labelClass = 'az-body-sm-bold text-az-ink-deep';

const ShippingAddressForm = ({
  address,
  defaultEmail,
}: {
  address: ShippingAddress;
  defaultEmail?: string;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [openProvince, setOpenProvince] = useState(false);
  const [openCity, setOpenCity] = useState(false);

  const form = useForm<z.infer<typeof shippingAddressSchema>>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      fullName: address?.fullName ?? '',
      contactEmail: address?.contactEmail ?? defaultEmail ?? '',
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

  const onSubmit: SubmitHandler<z.infer<typeof shippingAddressSchema>> = async (values) => {
    startTransition(async () => {
      const res = await updateUserAddress(values);

      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
        return;
      }

      router.push('/payment-method');
    });
  };

  return (
    <div className='max-w-xl mx-auto'>
      <div className='bg-az-canvas rounded-az-xxxl border border-az-hairline-soft p-6 md:p-8 space-y-6'>
        {/* Header */}
        <div className='space-y-1 border-b border-az-hairline-soft pb-5'>
          <h1 className='az-heading-sm text-az-ink-deep'>Dirección de Envío</h1>
          <p className='az-body-sm text-az-steel'>
            Ingresá los datos del destinatario y la dirección de entrega.
          </p>
        </div>

        <Form {...form}>
          <form method='post' className='space-y-5' onSubmit={form.handleSubmit(onSubmit)}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Full name — full width */}
              <div className='col-span-1 md:col-span-2'>
                <FormField
                  control={form.control}
                  name='fullName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Nombre del Destinatario</FormLabel>
                      <FormControl>
                        <Input
                          id='shipping-full-name'
                          placeholder='Nombre completo de quien recibe'
                          className={inputClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact email — full width */}
              <div className='col-span-1 md:col-span-2'>
                <FormField
                  control={form.control}
                  name='contactEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Email de Contacto</FormLabel>
                      <FormControl>
                        <Input
                          id='shipping-email'
                          placeholder='Correo electrónico para avisos de envío'
                          className={inputClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Street address — full width */}
              <div className='col-span-1 md:col-span-2'>
                <FormField
                  control={form.control}
                  name='streetAddress'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Calle y Altura</FormLabel>
                      <FormControl>
                        <Input
                          id='shipping-street'
                          placeholder='Dirección de entrega'
                          className={inputClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Floor */}
              <FormField
                control={form.control}
                name='floor'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Piso (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        id='shipping-floor'
                        placeholder='Ej: 2'
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Apartment */}
              <FormField
                control={form.control}
                name='apartment'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Depto (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        id='shipping-apartment'
                        placeholder='Ej: B'
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        id='shipping-phone'
                        placeholder='Ej: +54 9 11 1234-5678'
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Postal code */}
              <FormField
                control={form.control}
                name='postalCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Código Postal</FormLabel>
                    <FormControl>
                      <Input
                        id='shipping-postal-code'
                        placeholder='Código postal'
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Province combobox */}
              <FormField
                control={form.control}
                name='province'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel className={cn(labelClass, 'h-5 mt-1')}>Provincia</FormLabel>
                    <Popover open={openProvince} onOpenChange={setOpenProvince}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id='shipping-province'
                            variant='outline'
                            role='combobox'
                            className={cn(
                              'w-full justify-between bg-az-canvas border-az-hairline-soft text-az-ink rounded-az-lg h-11 hover:bg-az-surface-soft',
                              !field.value && 'text-az-stone'
                            )}
                          >
                            {field.value
                              ? provincias.provinces.find((p) => p.name === field.value)?.name
                              : 'Seleccionar provincia...'}
                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className='w-full p-0 max-h-[300px] overflow-y-auto z-[9999] bg-az-canvas border-az-hairline-soft rounded-az-xl'
                        align='start'
                      >
                        <Command className='bg-transparent'>
                          <CommandInput
                            placeholder='Buscar provincia...'
                            className='border-none outline-none ring-0'
                          />
                          <CommandList>
                            <CommandEmpty>No se encontró la provincia.</CommandEmpty>
                            <CommandGroup>
                              {provincias.provinces.map((prov) => (
                                <CommandItem
                                  value={prov.name}
                                  key={prov.id}
                                  onSelect={() => {
                                    form.setValue('province', prov.name);
                                    form.setValue('city', '');
                                    setOpenProvince(false);
                                  }}
                                  className='cursor-pointer text-az-ink hover:bg-az-surface-soft'
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4 text-az-primary',
                                      prov.name === field.value ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {prov.name}
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

              {/* City combobox */}
              <FormField
                control={form.control}
                name='city'
                render={({ field }) => {
                  const selectedProvince = provincias.provinces.find(
                    (p) => p.name === form.getValues('province')
                  );
                  const cities = selectedProvince?.cities || [];

                  return (
                    <FormItem className='flex flex-col'>
                      <FormLabel className={cn(labelClass, 'h-5 mt-1')}>
                        Ciudad / Localidad
                      </FormLabel>
                      <Popover open={openCity} onOpenChange={setOpenCity}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              id='shipping-city'
                              variant='outline'
                              role='combobox'
                              disabled={!form.getValues('province')}
                              className={cn(
                                'w-full justify-between bg-az-canvas border-az-hairline-soft text-az-ink rounded-az-lg h-11 hover:bg-az-surface-soft',
                                !field.value && 'text-az-stone'
                              )}
                            >
                              {field.value
                                ? field.value
                                : form.getValues('province')
                                  ? 'Seleccionar ciudad...'
                                  : 'Selecciona provincia primero...'}
                              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className='w-full p-0 max-h-[300px] overflow-y-auto z-[9999] bg-az-canvas border-az-hairline-soft rounded-az-xl'
                          align='start'
                        >
                          <Command className='bg-transparent'>
                            <CommandInput
                              placeholder='Buscar ciudad...'
                              className='border-none outline-none ring-0'
                            />
                            <CommandList>
                              <CommandEmpty>No se encontró la ciudad.</CommandEmpty>
                              <CommandGroup>
                                {cities.map((city) => (
                                  <CommandItem
                                    value={city}
                                    key={city}
                                    onSelect={() => {
                                      form.setValue('city', city);
                                      setOpenCity(false);
                                    }}
                                    className='cursor-pointer text-az-ink hover:bg-az-surface-soft'
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4 text-az-primary',
                                        city === field.value ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {city}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Country — disabled */}
              <div className='col-span-1 md:col-span-2'>
                <FormField
                  control={form.control}
                  name='country'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(labelClass, 'text-az-stone')}>País</FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          placeholder='País'
                          className='bg-az-surface-soft border-az-hairline-soft rounded-az-lg text-az-stone cursor-not-allowed h-11'
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
              id='shipping-submit'
              type='submit'
              variant='buyCta'
              size='lg'
              className='w-full mt-2'
              disabled={isPending}
            >
              {isPending ? (
                <Loader className='w-4 h-4 animate-spin' />
              ) : (
                <>
                  Continuar al pago
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

export default ShippingAddressForm;
