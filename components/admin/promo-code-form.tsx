'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { createPromoCode, updatePromoCode } from '@/lib/actions/promo-code.actions';

const promoCodeSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres'),
  description: z.string().optional(),
  discountPercent: z.coerce
    .number()
    .min(0.01, 'El descuento debe ser mayor a 0')
    .max(100, 'El descuento no puede ser mayor a 100'),
  isActive: z.boolean().default(true),
  maxUsesPerUser: z.coerce
    .number()
    .int()
    .positive('Debe ser un número positivo')
    .optional()
    .nullable(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

type PromoCodeFormData = z.infer<typeof promoCodeSchema>;

interface PromoCodeFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function PromoCodeForm({ initialData, isEdit = false }: PromoCodeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: initialData?.code ?? '',
      description: initialData?.description ?? '',
      discountPercent: initialData?.discountPercent ? Number(initialData.discountPercent) : 10,
      isActive: initialData?.isActive ?? true,
      maxUsesPerUser: initialData?.maxUsesPerUser ? Number(initialData.maxUsesPerUser) : null,
      startsAt: initialData?.startsAt ? initialData.startsAt : '',
      endsAt: initialData?.endsAt ? initialData.endsAt : '',
    },
  });

  const onSubmit = async (data: PromoCodeFormData) => {
    startTransition(async () => {
      try {
        const result = isEdit
          ? await updatePromoCode(initialData.id, {
              ...data,
              startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
              endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
            })
          : await createPromoCode({
              ...data,
              startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
              endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
            });

        if (result.success) {
          toast({
            description: result.message,
            variant: 'default',
          });
          router.replace('/admin/promotions/discount-codes');
          router.refresh();
        } else {
          toast({
            description: result.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          description: 'Ocurrió un error',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className='max-w-2xl mx-auto space-y-8'>
      <div>
        <h1 className='az-heading-sm text-az-ink-deep'>
          {isEdit ? 'Editar Código Promocional' : 'Crear Código Promocional'}
        </h1>
        <p className='az-body-sm text-az-steel mt-1'>
          El descuento se aplica a todos los productos de la tienda.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Código */}
          <FormField
            control={form.control}
            name='code'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='az-body-sm-bold text-az-ink-deep'>Código Promocional</FormLabel>
                <FormControl>
                  <Input
                    placeholder='VERANO2026'
                    {...field}
                    disabled={isEdit}
                    value={field.value?.toUpperCase() || ''}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    className='bg-az-canvas border-az-hairline-soft rounded-az-lg h-11'
                  />
                </FormControl>
                <FormDescription className='az-caption text-az-stone'>
                  {isEdit ? 'No se puede modificar después de crear' : 'Se guardará en mayúsculas automáticamente'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='az-body-sm-bold text-az-ink-deep'>Descripción (uso interno)</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Ej: Descuento especial para campaña de verano'
                    {...field}
                    value={field.value || ''}
                    className='bg-az-canvas border-az-hairline-soft rounded-az-lg h-11'
                  />
                </FormControl>
                <FormDescription className='az-caption text-az-stone'>
                  Solo visible para administradores
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Porcentaje de descuento */}
          <FormField
            control={form.control}
            name='discountPercent'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='az-body-sm-bold text-az-ink-deep'>Porcentaje de Descuento</FormLabel>
                <FormControl>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      placeholder='10'
                      {...field}
                      value={field.value || ''}
                      min={0.01}
                      max={100}
                      step={0.01}
                      className='bg-az-canvas border-az-hairline-soft rounded-az-lg h-11 max-w-[140px]'
                    />
                    <span className='az-body-sm-bold text-az-steel'>%</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Máximo de usos */}
          <FormField
            control={form.control}
            name='maxUsesPerUser'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='az-body-sm-bold text-az-ink-deep'>Máximo de Usos por Usuario</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='Sin límite'
                    {...field}
                    value={field.value || ''}
                    min={1}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        field.onChange(null);
                      } else {
                        field.onChange(parseInt(e.target.value, 10));
                      }
                    }}
                    className='bg-az-canvas border-az-hairline-soft rounded-az-lg h-11 max-w-[140px]'
                  />
                </FormControl>
                <FormDescription className='az-caption text-az-stone'>
                  Vacío = uso ilimitado por usuario
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fechas de vigencia */}
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='startsAt'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='az-body-sm-bold text-az-ink-deep'>Fecha de Inicio</FormLabel>
                  <FormControl>
                    <Input
                      type='datetime-local'
                      {...field}
                      value={field.value || ''}
                      className='bg-az-canvas border-az-hairline-soft rounded-az-lg h-11'
                    />
                  </FormControl>
                  <FormDescription className='az-caption text-az-stone'>Vacío = inmediato</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='endsAt'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='az-body-sm-bold text-az-ink-deep'>Fecha de Vencimiento</FormLabel>
                  <FormControl>
                    <Input
                      type='datetime-local'
                      {...field}
                      value={field.value || ''}
                      className='bg-az-canvas border-az-hairline-soft rounded-az-lg h-11'
                    />
                  </FormControl>
                  <FormDescription className='az-caption text-az-stone'>Vacío = sin vencimiento</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Estado */}
          <FormField
            control={form.control}
            name='isActive'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='az-body-sm-bold text-az-ink-deep'>Estado</FormLabel>
                <FormControl>
                  <div className='flex items-center gap-6'>
                    <label className='flex items-center gap-3 cursor-pointer group'>
                      <input
                        type='radio'
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        className='w-4 h-4 accent-az-primary'
                      />
                      <span className='az-body-sm text-az-charcoal group-hover:text-az-ink-deep transition-colors'>
                        Activo
                      </span>
                    </label>
                    <label className='flex items-center gap-3 cursor-pointer group'>
                      <input
                        type='radio'
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        className='w-4 h-4 accent-az-primary'
                      />
                      <span className='az-body-sm text-az-charcoal group-hover:text-az-ink-deep transition-colors'>
                        Inactivo
                      </span>
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Botones de acción */}
          <div className='flex gap-3 pt-4 border-t border-az-hairline-soft'>
            <Button
              type='submit'
              disabled={isPending}
              className='flex-1'
              variant='buyCta'
              size='lg'
            >
              {isPending ? 'Procesando...' : isEdit ? 'Actualizar Código' : 'Crear Código'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
              className='flex-1'
              size='lg'
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
