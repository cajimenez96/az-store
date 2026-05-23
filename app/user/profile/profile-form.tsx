'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, updateUserAddress } from '@/lib/actions/user.actions';
import { shippingAddressSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ShippingAddress } from '@/types';
import provincias from '@/lib/data/argentina.json';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ProfileFormProps {
  address?: ShippingAddress;
}

const profileFormSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  contactEmail: z.string().optional(),
  fullName: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  apartment: z.string().optional(),
  floor: z.string().optional(),
});

const ProfileForm = ({ address }: ProfileFormProps) => {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [openProvince, setOpenProvince] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name ?? '',
      email: session?.user?.email ?? '',
      contactEmail: address?.contactEmail ?? session?.user?.email ?? '',
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

  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    // 1. Actualizar perfil (nombre)
    const profileRes = await updateProfile({ name: values.name, email: values.email });

    if (!profileRes.success) {
      return toast({
        variant: 'destructive',
        description: profileRes.message,
      });
    }

    // 2. Si se completó algún campo de dirección, se valida e intenta guardar la dirección
    const hasAnyAddressField = !!(
      values.fullName ||
      values.streetAddress ||
      values.city ||
      values.province ||
      values.postalCode ||
      values.phone
    );

    if (hasAnyAddressField) {
      const addressValidation = shippingAddressSchema.safeParse({
        contactEmail: values.contactEmail || session?.user?.email || '',
        fullName: values.fullName,
        streetAddress: values.streetAddress,
        city: values.city,
        province: values.province,
        postalCode: values.postalCode,
        country: values.country,
        phone: values.phone,
        apartment: values.apartment,
        floor: values.floor,
      });

      if (!addressValidation.success) {
        return toast({
          variant: 'destructive',
          description: 'Por favor completá correctamente todos los campos obligatorios de la dirección (mínimo 3 caracteres, teléfono 8 caracteres).',
        });
      }

      const addressRes = await updateUserAddress(addressValidation.data);
      if (!addressRes.success) {
        return toast({
          variant: 'destructive',
          description: addressRes.message,
        });
      }
    }

    const newSession = {
      ...session,
      user: {
        ...session?.user,
        name: values.name,
      },
    };

    await update(newSession);

    toast({
      description: 'Perfil y dirección actualizados exitosamente.',
    });
  };

  return (
    <div className='bg-white dark:bg-canvas-night-elevated shadow-level-3 rounded-lg border border-hairline-light dark:border-hairline-dark p-6 md:p-8 w-full animate-fade-in'>
      <Form {...form}>
        <form
          className='grid grid-cols-1 lg:grid-cols-12 gap-8'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* Columna Izquierda: Datos Personales */}
          <div className='lg:col-span-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/20 p-5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/40 self-start w-full'>
            <h3 className='font-display font-[330] text-xl text-black dark:text-white border-b border-hairline-light dark:border-hairline-dark pb-2 mb-4'>Datos Personales</h3>
            <div className='flex flex-col gap-4'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        disabled
                        placeholder='Email'
                        className='bg-canvas-cream dark:bg-[#1a1a1a] border-hairline-light dark:border-hairline-dark rounded-md text-zinc-500 cursor-not-allowed'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className='text-xs text-zinc-400'>
                      El correo electrónico no puede ser modificado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Nombre'
                        className='bg-white dark:bg-black border-hairline-light dark:border-hairline-dark rounded-md text-black dark:text-white focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-0'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Columna Derecha: Dirección de Envío */}
          <div className='lg:col-span-8 space-y-4'>
            <h3 className='font-display font-[330] text-xl text-black dark:text-white border-b border-hairline-light dark:border-hairline-dark pb-2 mb-2'>Dirección de Envío Predeterminada</h3>
            <p className='text-xs text-zinc-500 mb-4'>
              Completá estos datos para que se carguen automáticamente en tu próximo checkout.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='col-span-1 md:col-span-2'>
                <FormField
                  control={form.control}
                  name='fullName'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Nombre del Destinatario</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nombre y apellido de quien recibe'
                          className='bg-white dark:bg-black border-hairline-light dark:border-hairline-dark rounded-md text-black dark:text-white focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-0'
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
                  name='contactEmail'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Email de Contacto</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Correo electrónico para avisos de envío'
                          className='bg-white dark:bg-black border-hairline-light dark:border-hairline-dark rounded-md text-black dark:text-white focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-0'
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
                      <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Calle y Altura</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Ej: Comb. de los Pozos 1026'
                          className='bg-white dark:bg-black border-hairline-light dark:border-hairline-dark rounded-md text-black dark:text-white focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-0'
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
                    <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Piso (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ej: 2'
                        className='bg-white dark:bg-black border-hairline-light dark:border-hairline-dark rounded-md text-black dark:text-white focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-0'
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
                    <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Depto (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ej: B'
                        className='bg-white dark:bg-black border-hairline-light dark:border-hairline-dark rounded-md text-black dark:text-white focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-0'
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
                    <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ej: +54 9 11 1234-5678'
                        className='bg-white dark:bg-black border-hairline-light dark:border-hairline-dark rounded-md text-black dark:text-white focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-0'
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
                    <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Código Postal</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Código postal'
                        className='bg-white dark:bg-black border-hairline-light dark:border-hairline-dark rounded-md text-black dark:text-white focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-0'
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
                  <FormItem className='flex flex-col'>
                    <FormLabel className='text-sm font-medium text-black dark:text-zinc-300 h-5 mt-1'>Provincia</FormLabel>
                    <Popover open={openProvince} onOpenChange={setOpenProvince}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className={cn(
                              'w-full justify-between bg-white dark:bg-black border-hairline-light dark:border-hairline-dark text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900',
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
                      <PopoverContent className='w-full p-0 max-h-[300px] overflow-y-auto z-[9999] bg-white dark:bg-canvas-night-elevated border-hairline-light dark:border-hairline-dark' align="start">
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
                                  className='cursor-pointer text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
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
                    <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Ciudad / Localidad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ciudad / Localidad'
                        className='bg-white dark:bg-black border-hairline-light dark:border-hairline-dark rounded-md text-black dark:text-white focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-0'
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
                      <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>País</FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          placeholder='País'
                          className='bg-canvas-cream dark:bg-[#1a1a1a] border-hairline-light dark:border-hairline-dark rounded-md text-zinc-500 cursor-not-allowed'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className='lg:col-span-12 flex justify-end mt-4 border-t border-hairline-light dark:border-hairline-dark pt-6'>
            <Button
              type='submit'
              size='lg'
              className='w-full sm:w-auto px-8 font-semibold'
              variant='primaryPill'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Actualizando...' : 'Actualizar Perfil'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProfileForm;
