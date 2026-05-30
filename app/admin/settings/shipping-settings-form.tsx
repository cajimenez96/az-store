'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateShippingSettings } from '@/lib/actions/settings.actions';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface ShippingValues {
  freeShippingThreshold: number;
  freeShippingCities: { city: string }[];
}

const inputClass =
  'bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0';
const labelClass = 'az-body-sm-bold text-az-ink-deep';

export default function ShippingSettingsForm({
  initialValues,
}: {
  initialValues: {
    freeShippingThreshold: number;
    freeShippingCities: string[];
  };
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<ShippingValues>({
    defaultValues: {
      freeShippingThreshold: initialValues.freeShippingThreshold,
      freeShippingCities: initialValues.freeShippingCities.map((city) => ({ city })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'freeShippingCities',
  });

  const { toast } = useToast();

  const onSubmit = async (values: ShippingValues) => {
    const res = await updateShippingSettings({
      freeShippingThreshold: values.freeShippingThreshold,
      freeShippingCities: values.freeShippingCities.map((item) => item.city),
    });
    toast({ description: res.message, variant: res.success ? 'default' : 'destructive' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {/* Free Shipping Threshold */}
      <div className='space-y-1.5'>
        <Label className={labelClass}>Monto mínimo para envío gratis ($)</Label>
        <Input
          type='number'
          {...register('freeShippingThreshold', { valueAsNumber: true })}
          placeholder='Ej: 60000'
          className={inputClass}
        />
        <p className='az-caption text-az-stone mt-1'>
          Órdenes mayores a este monto tienen envío gratis
        </p>
      </div>

      {/* Free Shipping Cities */}
      <div className='space-y-3'>
        <Label className={labelClass}>Localidades con envío gratis (Retiro)</Label>
        <div className='space-y-2'>
          {fields.map((field, index) => (
            <div key={field.id} className='flex items-end gap-2'>
              <Input
                {...register(`freeShippingCities.${index}.city`)}
                placeholder='Ej: San Miguel de Tucumán'
                className={inputClass}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => remove(index)}
                className='h-10 w-10 text-az-critical hover:bg-red-50'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type='button'
          variant='outline'
          onClick={() => append({ city: '' })}
          className='mt-2'
        >
          + Agregar localidad
        </Button>
        <p className='az-caption text-az-stone mt-1'>
          Estas localidades tendrán envío gratis (retiro en local)
        </p>
      </div>

      {/* Submit */}
      <div className='flex justify-end pt-2'>
        <Button type='submit' variant='buyCta' disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar configuración de envíos'}
        </Button>
      </div>
    </form>
  );
}
