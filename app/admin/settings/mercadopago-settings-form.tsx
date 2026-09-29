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
  'bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111]';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-[#111111]';

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
      <div className='bg-[#f9f9f9] border border-[#e5e5e5] rounded-xl p-3.5 mb-4'>
        <p className='text-xs text-[#707072]'>
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
          <p className='text-xs text-[#707072] mt-1'>
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
          <p className='text-xs text-[#707072] mt-1'>Clave pública para el cliente.</p>
        </div>
      </div>

      <div className='flex justify-end pt-2'>
        <Button
          type='submit'
          disabled={isSubmitting}
          className='bg-[#111111] hover:bg-black text-white rounded-full font-medium shadow-sm transition-all px-6 py-2.5 h-auto'
        >
          {isSubmitting ? 'Guardando...' : 'Guardar credenciales'}
        </Button>
      </div>
    </form>
  );
}
