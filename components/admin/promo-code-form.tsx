'use client';

import { useTransition } from 'react';
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
import {
  createPromoCode,
  updatePromoCode,
} from '@/lib/actions/promo-code.actions';

const optionalDiscountInput = z
  .union([z.literal(''), z.coerce.number().min(0).max(100)])
  .optional();

const promoCodeSchema = z
  .object({
    code: z
      .string()
      .min(3, 'El código debe tener al menos 3 caracteres')
      .max(20, 'El código no puede exceder 20 caracteres'),
    description: z.string().optional(),
    discountPercentMercadoPago: optionalDiscountInput,
    discountPercentTransferencia: optionalDiscountInput,
    isActive: z.boolean().default(true),
    maxUsesPerUser: z.coerce
      .number()
      .int()
      .positive('Debe ser un número positivo')
      .optional()
      .nullable(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
  })
  .refine(
    (data) => {
      const mp = data.discountPercentMercadoPago;
      const tr = data.discountPercentTransferencia;
      return (
        (typeof mp === 'number' && mp > 0) || (typeof tr === 'number' && tr > 0)
      );
    },
    {
      path: ['discountPercentMercadoPago'],
      message: 'Definí un descuento para al menos un método de pago',
    }
  );

type PromoCodeFormData = z.infer<typeof promoCodeSchema>;

interface PromoCodeFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function PromoCodeForm({
  initialData,
  isEdit = false,
}: PromoCodeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: initialData?.code ?? '',
      description: initialData?.description ?? '',
      discountPercentMercadoPago:
        initialData?.discountPercentMercadoPago == null
          ? ''
          : Number(initialData.discountPercentMercadoPago),
      discountPercentTransferencia:
        initialData?.discountPercentTransferencia == null
          ? ''
          : Number(initialData.discountPercentTransferencia),
      isActive: initialData?.isActive ?? true,
      maxUsesPerUser: initialData?.maxUsesPerUser
        ? Number(initialData.maxUsesPerUser)
        : null,
      startsAt: initialData?.startsAt ? initialData.startsAt : '',
      endsAt: initialData?.endsAt ? initialData.endsAt : '',
    },
  });

  const onSubmit = async (data: PromoCodeFormData) => {
    startTransition(async () => {
      try {
        const normalize = (value: number | '' | undefined): number | null => {
          if (value === '' || value === undefined) return null;
          return Number(value);
        };

        const payload = {
          ...data,
          discountPercentMercadoPago: normalize(
            data.discountPercentMercadoPago
          ),
          discountPercentTransferencia: normalize(
            data.discountPercentTransferencia
          ),
          startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
          endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        };

        const result = isEdit
          ? await updatePromoCode(initialData.id, payload)
          : await createPromoCode(payload);

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
      } catch {
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
        <h1 className='font-marder-display text-3xl font-black uppercase tracking-tight text-[#111111]'>
          {isEdit ? 'Editar Código Promocional' : 'Crear Código Promocional'}
        </h1>
        <p className='text-sm text-[#707072] mt-1'>
          Definí un porcentaje distinto para MercadoPago y Transferencia. Los
          cupones no aplican a pagos en punto de venta.
        </p>
      </div>

      <div className='bg-white border border-[#e5e5e5] rounded-2xl p-6 md:p-8 shadow-sm'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Código */}
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-bold uppercase tracking-wider text-[#111111]'>
                    Código Promocional
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='VERANO2026'
                      {...field}
                      disabled={isEdit}
                      value={field.value?.toUpperCase() || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      className='bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11'
                    />
                  </FormControl>
                  <FormDescription className='text-xs text-[#707072]'>
                    {isEdit
                      ? 'No se puede modificar después de crear'
                      : 'Se guardará en mayúsculas automáticamente'}
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
                  <FormLabel className='text-xs font-bold uppercase tracking-wider text-[#111111]'>
                    Descripción (uso interno)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Ej: Descuento especial para campaña de verano'
                      {...field}
                      value={field.value || ''}
                      className='bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11'
                    />
                  </FormControl>
                  <FormDescription className='text-xs text-[#707072]'>
                    Solo visible para administradores
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Porcentajes de descuento por método de pago */}
            <div className='space-y-3'>
              <div>
                <FormLabel className='text-xs font-bold uppercase tracking-wider text-[#111111]'>
                  Descuentos por Método de Pago
                </FormLabel>
                <FormDescription className='text-xs text-[#707072] mt-1'>
                  Dejá vacío si el cupón no aplica a ese método. Al menos uno debe
                  ser mayor a 0.
                </FormDescription>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='discountPercentMercadoPago'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-[#111111]'>
                        MercadoPago
                      </FormLabel>
                      <FormControl>
                        <div className='flex items-center gap-2'>
                          <Input
                            type='number'
                            placeholder='10'
                            {...field}
                            value={
                              field.value === null || field.value === undefined
                                ? ''
                                : field.value
                            }
                            min={0}
                            max={100}
                            step={0.01}
                            className='bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11'
                            onChange={(event) => {
                              const raw = event.target.value;
                              field.onChange(raw === '' ? '' : Number(raw));
                            }}
                          />
                          <span className='text-sm font-bold text-[#707072]'>%</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='discountPercentTransferencia'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-[#111111]'>
                        Transferencia
                      </FormLabel>
                      <FormControl>
                        <div className='flex items-center gap-2'>
                          <Input
                            type='number'
                            placeholder='20'
                            {...field}
                            value={
                              field.value === null || field.value === undefined
                                ? ''
                                : field.value
                            }
                            min={0}
                            max={100}
                            step={0.01}
                            className='bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11'
                            onChange={(event) => {
                              const raw = event.target.value;
                              field.onChange(raw === '' ? '' : Number(raw));
                            }}
                          />
                          <span className='text-sm font-bold text-[#707072]'>%</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {form.formState.errors.discountPercentMercadoPago?.message && (
                <p className='text-xs text-red-600 font-medium'>
                  {form.formState.errors.discountPercentMercadoPago?.message}
                </p>
              )}
            </div>

            {/* Máximo de usos */}
            <FormField
              control={form.control}
              name='maxUsesPerUser'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-bold uppercase tracking-wider text-[#111111]'>
                    Máximo de Usos por Usuario
                  </FormLabel>
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
                      className='bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11 max-w-[140px]'
                    />
                  </FormControl>
                  <FormDescription className='text-xs text-[#707072]'>
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
                    <FormLabel className='text-xs font-bold uppercase tracking-wider text-[#111111]'>
                      Fecha de Inicio
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
                        {...field}
                        value={field.value || ''}
                        className='bg-white border-[#e5e5e5] rounded-xl text-[#111111] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11'
                      />
                    </FormControl>
                    <FormDescription className='text-xs text-[#707072]'>
                      Vacío = inmediato
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='endsAt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-bold uppercase tracking-wider text-[#111111]'>
                      Fecha de Vencimiento
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
                        {...field}
                        value={field.value || ''}
                        className='bg-white border-[#e5e5e5] rounded-xl text-[#111111] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11'
                      />
                    </FormControl>
                    <FormDescription className='text-xs text-[#707072]'>
                      Vacío = sin vencimiento
                    </FormDescription>
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
                  <FormLabel className='text-xs font-bold uppercase tracking-wider text-[#111111]'>
                    Estado
                  </FormLabel>
                  <FormControl>
                    <div className='flex items-center gap-6 pt-1'>
                      <label className='flex items-center gap-3 cursor-pointer group'>
                        <input
                          type='radio'
                          checked={field.value === true}
                          onChange={() => field.onChange(true)}
                          className='w-4 h-4 accent-[#111111]'
                        />
                        <span className='text-sm font-medium text-[#111111] group-hover:text-black transition-colors'>
                          Activo
                        </span>
                      </label>
                      <label className='flex items-center gap-3 cursor-pointer group'>
                        <input
                          type='radio'
                          checked={field.value === false}
                          onChange={() => field.onChange(false)}
                          className='w-4 h-4 accent-[#111111]'
                        />
                        <span className='text-sm font-medium text-[#707072] group-hover:text-[#111111] transition-colors'>
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
            <div className='flex gap-3 pt-4 border-t border-[#e5e5e5]'>
              <Button
                type='submit'
                disabled={isPending}
                className='flex-1 bg-[#111111] hover:bg-black text-white rounded-full font-medium shadow-sm transition-all px-6 py-3 h-auto'
              >
                {isPending
                  ? 'Procesando...'
                  : isEdit
                    ? 'Actualizar Código'
                    : 'Crear Código'}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                className='flex-1 border-[#e5e5e5] rounded-full text-[#111111] hover:bg-[#f5f5f5] font-semibold px-6 py-3 h-auto'
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
