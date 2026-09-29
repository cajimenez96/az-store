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
  'bg-white border-[#cacacb] rounded-full text-nike-ink placeholder:text-[#8e8e93] focus-visible:ring-1 focus-visible:ring-nike-ink focus-visible:ring-offset-0 h-12 px-5 text-sm transition-colors';
const labelClass = 'text-xs font-semibold uppercase tracking-wider text-nike-ink/80 mb-1 block';

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
      <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 md:p-8 space-y-6 shadow-sm'>
        {/* Header */}
        <div className='space-y-1 border-b border-[#e5e5e5] pb-5'>
          <h1 className='font-marder-display font-medium text-3xl tracking-tight text-nike-ink'>
            Dirección de Envío
          </h1>
          <p className='text-sm text-[#757575]'>
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
                              'w-full justify-between bg-white border-[#cacacb] text-nike-ink rounded-full h-12 px-5 text-sm hover:bg-[#f5f5f5]',
                              !field.value && 'text-[#8e8e93]'
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
                        className='w-full p-0 max-h-[300px] overflow-y-auto z-[9999] bg-white border border-[#e5e5e5] rounded-xl shadow-lg'
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
                                  className='cursor-pointer text-nike-ink hover:bg-[#f5f5f5]'
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4 text-nike-ink',
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
                                'w-full justify-between bg-white border-[#cacacb] text-nike-ink rounded-full h-12 px-5 text-sm hover:bg-[#f5f5f5]',
                                !field.value && 'text-[#8e8e93]'
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
                          className='w-full p-0 max-h-[300px] overflow-y-auto z-[9999] bg-white border border-[#e5e5e5] rounded-xl shadow-lg'
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
                                    className='cursor-pointer text-nike-ink hover:bg-[#f5f5f5]'
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4 text-nike-ink',
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
                      <FormLabel className={cn(labelClass, 'text-[#8e8e93]')}>País</FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          placeholder='País'
                          className='bg-[#f5f5f5] border-[#e5e5e5] rounded-full text-[#8e8e93] cursor-not-allowed h-12 px-5 text-sm'
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
              className='w-full mt-4 h-12 rounded-full bg-nike-ink text-white hover:bg-black font-medium transition-colors'
              disabled={isPending}
            >
              {isPending ? (
                <Loader className='w-4 h-4 animate-spin' />
              ) : (
                <span className='flex items-center justify-center gap-2'>
                  Continuar al pago
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

export default ShippingAddressForm;
