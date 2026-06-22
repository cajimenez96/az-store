'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { updateShippingSettings } from '@/lib/actions/settings.actions';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import provincias from '@/lib/data/argentina.json';

interface ShippingValues {
  freeShippingThreshold: number;
  freeShippingCities: { city: string }[];
}

const TUCUMAN_CITIES =
  provincias.provinces.find((p) => p.name === 'Tucumán')?.cities ?? [];

const inputClass =
  'bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0';
const labelClass = 'az-body-sm-bold text-az-ink-deep';

interface CityComboboxFieldProps {
  value: string;
  onChange: (value: string) => void;
}

function CityComboboxField({ value, onChange }: CityComboboxFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-full justify-between bg-az-canvas border-az-hairline text-az-ink hover:bg-az-surface-soft',
            !value && 'text-az-stone'
          )}
        >
          {value || 'Seleccionar localidad...'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-full p-0 max-h-[300px] overflow-y-auto z-[9999] bg-az-canvas border-az-hairline-soft'
        align='start'
      >
        <Command className='bg-transparent'>
          <CommandInput
            placeholder='Buscar localidad...'
            className='border-none outline-none ring-0'
          />
          <CommandList>
            <CommandEmpty>No se encontró la localidad.</CommandEmpty>
            <CommandGroup>
              {TUCUMAN_CITIES.map((city) => (
                <CommandItem
                  value={city}
                  key={city}
                  onSelect={() => {
                    onChange(city);
                    setOpen(false);
                  }}
                  className='cursor-pointer text-az-ink hover:bg-az-surface-soft'
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 text-az-primary',
                      city === value ? 'opacity-100' : 'opacity-0'
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
  );
}

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
    control,
    handleSubmit,
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
        <Label className={labelClass}>Localidades con envío gratis (Tucumán)</Label>
        <div className='space-y-2'>
          {fields.map((field, index) => (
            <div key={field.id} className='flex items-end gap-2'>
              <Controller
                control={control}
                name={`freeShippingCities.${index}.city`}
                render={({ field: cityField }) => (
                  <CityComboboxField
                    value={cityField.value}
                    onChange={cityField.onChange}
                  />
                )}
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
          Estas localidades de Tucumán tendrán envío gratis (retiro en local)
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
