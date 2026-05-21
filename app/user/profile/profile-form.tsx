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

interface ProfileFormProps {
  address?: ShippingAddress;
}

const profileFormSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  fullName: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

const ProfileForm = ({ address }: ProfileFormProps) => {
  const { data: session, update } = useSession();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name ?? '',
      email: session?.user?.email ?? '',
      fullName: address?.fullName ?? '',
      streetAddress: address?.streetAddress ?? '',
      city: address?.city ?? '',
      postalCode: address?.postalCode ?? '',
      country: address?.country ?? '',
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
      values.postalCode ||
      values.country
    );

    if (hasAnyAddressField) {
      const addressValidation = shippingAddressSchema.safeParse({
        fullName: values.fullName,
        streetAddress: values.streetAddress,
        city: values.city,
        postalCode: values.postalCode,
        country: values.country,
      });

      if (!addressValidation.success) {
        return toast({
          variant: 'destructive',
          description: 'Por favor completá todos los campos de dirección de envío (mínimo 3 caracteres c/u).',
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
    <div className='bg-white dark:bg-canvas-night-elevated shadow-level-3 rounded-lg border border-hairline-light dark:border-hairline-dark p-6 md:p-8 w-full'>
      <Form {...form}>
        <form
          className='flex flex-col gap-6'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className='space-y-4'>
            <h3 className='font-display font-[330] text-xl text-black dark:text-white border-b border-hairline-light dark:border-hairline-dark pb-2 mb-4'>Datos Personales</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

          <div className='space-y-4 mt-4'>
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
                  name='streetAddress'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Calle y Altura</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Dirección de entrega'
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
                name='city'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>Ciudad</FormLabel>
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
              <div className='col-span-1 md:col-span-2'>
                <FormField
                  control={form.control}
                  name='country'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel className='text-sm font-medium text-black dark:text-zinc-300'>País</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='País'
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
          </div>

          <Button
            type='submit'
            size='lg'
            className='w-full mt-4'
            variant='primaryPill'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Actualizando...' : 'Actualizar Perfil'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ProfileForm;
