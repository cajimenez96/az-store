'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateBankSettings } from '@/lib/actions/settings.actions';
import { useToast } from '@/hooks/use-toast';

interface BankValues {
  bank: string;
  accountHolder: string;
  cbu: string;
  alias: string;
  cuit: string;
}

const inputClass =
  'bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0';
const labelClass = 'az-body-sm-bold text-az-ink-deep';

export default function BankSettingsForm({ initialValues }: { initialValues: BankValues }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<BankValues>({ defaultValues: initialValues });
  const { toast } = useToast();

  const onSubmit = async (values: BankValues) => {
    const res = await updateBankSettings(values);
    toast({ description: res.message, variant: res.success ? 'default' : 'destructive' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div className='space-y-1.5'>
          <Label className={labelClass}>Banco</Label>
          <Input {...register('bank')} placeholder='Ej: Banco Galicia' className={inputClass} />
        </div>
        <div className='space-y-1.5'>
          <Label className={labelClass}>Titular de la cuenta</Label>
          <Input
            {...register('accountHolder')}
            placeholder='Nombre o razón social'
            className={inputClass}
          />
        </div>
        <div className='space-y-1.5'>
          <Label className={labelClass}>CBU</Label>
          <Input {...register('cbu')} placeholder='22 dígitos' className={inputClass} />
        </div>
        <div className='space-y-1.5'>
          <Label className={labelClass}>Alias</Label>
          <Input {...register('alias')} placeholder='Ej: MI.ALIAS.MP' className={inputClass} />
        </div>
        <div className='space-y-1.5 sm:col-span-2'>
          <Label className={labelClass}>CUIT</Label>
          <Input {...register('cuit')} placeholder='Ej: 30-12345678-9' className={inputClass} />
        </div>
      </div>
      <div className='flex justify-end pt-2'>
        <Button type='submit' variant='buyCta' disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar datos bancarios'}
        </Button>
      </div>
    </form>
  );
}
