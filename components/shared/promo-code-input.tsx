'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoCodeInputProps {
  onPromoApplied?: (
    code: string,
    discountPercent: number,
    appliedPaymentMethod: 'MercadoPago' | 'TransferenciaBancaria'
  ) => void;
  onPromoRemoved?: () => void;
  appliedCode?: string;
  appliedDiscount?: number;
  appliedPaymentMethod?: string;
}

export function PromoCodeInput({
  onPromoApplied,
  onPromoRemoved,
  appliedCode,
  appliedDiscount,
  appliedPaymentMethod,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError('Ingresa un código promocional');
      return;
    }

    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/validate-promo?code=${encodeURIComponent(code)}`
        );
        const data = await response.json();

        if (data.valid) {
          setSuccess(data.message);
          setCode('');
          onPromoApplied?.(
            code.toUpperCase(),
            data.discountPercent,
            data.appliedPaymentMethod
          );
        } else {
          setError(data.message);
        }
      } catch {
        setError('Error al validar el código');
      }
    });
  };

  const handleRemoveCode = () => {
    setCode('');
    setError('');
    setSuccess('');
    onPromoRemoved?.();
  };

  if (appliedCode) {
    return (
      <div className='bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl p-4 space-y-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Check className='w-4 h-4 text-nike-ink' />
            <div>
              <p className='text-xs uppercase font-semibold text-[#757575]'>Código aplicado</p>
              <p className='text-sm font-bold text-nike-ink tracking-wider'>{appliedCode}</p>
            </div>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleRemoveCode}
            className='text-[#757575] hover:text-nike-ink h-8 w-8 p-0 rounded-full'
          >
            <X className='w-4 h-4' />
          </Button>
        </div>
        {appliedDiscount && (
          <div className='text-xs text-nike-ink font-medium'>
            <p>
              Descuento:{' '}
              <strong className='font-semibold'>
                {appliedDiscount}% con {appliedPaymentMethod}
              </strong>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-2.5'>
      <label className='text-xs font-semibold uppercase tracking-wider text-nike-ink/80 block'>
        Código Promocional (opcional)
      </label>
      <div className='flex gap-2'>
        <Input
          type='text'
          placeholder='Ingresá tu código'
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
            setSuccess('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleApplyCode();
            }
          }}
          className={cn(
            'bg-white border-[#cacacb] rounded-full text-nike-ink h-11 px-4 text-sm focus-visible:ring-1 focus-visible:ring-nike-ink uppercase tracking-wider',
            error && 'border-red-400 focus-visible:ring-red-200'
          )}
        />
        <Button
          type='button'
          onClick={handleApplyCode}
          disabled={isPending || !code.trim()}
          className='h-11 px-6 rounded-full bg-nike-ink text-white hover:bg-black text-sm font-medium transition-colors'
        >
          {isPending ? <Loader className='w-4 h-4 animate-spin' /> : 'Aplicar'}
        </Button>
      </div>

      {error && (
        <div className='flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-200/50'>
          <X className='w-4 h-4 text-red-600 mt-0.5 flex-shrink-0' />
          <p className='text-xs text-red-700'>{error}</p>
        </div>
      )}

      {success && (
        <div className='flex items-start gap-2 bg-green-50 p-3 rounded-xl border border-green-200/50'>
          <Check className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
          <p className='text-xs text-green-700'>{success}</p>
        </div>
      )}
    </div>
  );
}
