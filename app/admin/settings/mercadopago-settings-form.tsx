'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateMercadoPagoSettings } from '@/lib/actions/settings.actions';
import { useToast } from '@/hooks/use-toast';

interface MercadoPagoValues {
  accessToken: string;
  publicKey: string;
}

const inputClass =
  'bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0';
const labelClass = 'az-body-sm-bold text-az-ink-deep';

export default function MercadoPagoSettingsForm({
  initialValues,
}: {
  initialValues: MercadoPagoValues;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<MercadoPagoValues>({ defaultValues: initialValues });
  const { toast } = useToast();

  const onSubmit = async (values: MercadoPagoValues) => {
    const res = await updateMercadoPagoSettings(values);
    toast({ description: res.message, variant: res.success ? 'default' : 'destructive' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='bg-az-surface-soft border border-az-hairline-soft rounded-az-lg p-3 mb-4'>
        <p className='az-caption text-az-stone'>
          ℹ️ El Access Token se encripta antes de guardarse. La clave pública es visible.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        <div className='space-y-1.5'>
          <Label className={labelClass}>Access Token</Label>
          <Input
            {...register('accessToken')}
            placeholder='TEST-...'
            type='password'
            className={inputClass}
          />
          <p className='az-caption text-az-stone mt-1'>
            Token de acceso secreto. Se encripta automáticamente.
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label className={labelClass}>Clave Pública</Label>
          <Input
            {...register('publicKey')}
            placeholder='TEST-...'
            className={inputClass}
          />
          <p className='az-caption text-az-stone mt-1'>Clave pública para el cliente.</p>
        </div>
      </div>

      <div className='flex justify-end pt-2'>
        <Button type='submit' variant='buyCta' disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar credenciales'}
        </Button>
      </div>
    </form>
  );
}
