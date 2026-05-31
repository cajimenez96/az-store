'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoCodeInputProps {
  onPromoApplied?: (code: string, discountPercent: number) => void;
  onPromoRemoved?: () => void;
  appliedCode?: string;
  appliedDiscount?: number;
}

export function PromoCodeInput({
  onPromoApplied,
  onPromoRemoved,
  appliedCode,
  appliedDiscount,
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
        const response = await fetch(`/api/validate-promo?code=${encodeURIComponent(code)}`);
        const data = await response.json();

        if (data.valid) {
          setSuccess(data.message);
          setCode('');
          onPromoApplied?.(code.toUpperCase(), data.discountPercent);
        } else {
          setError(data.message);
        }
      } catch (err) {
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
      <div className='bg-green-50 border border-green-200 rounded-az-lg p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Check className='w-5 h-5 text-green-600' />
            <div>
              <p className='az-body-sm-bold text-green-900'>Código aplicado</p>
              <p className='az-caption text-green-700'>{appliedCode}</p>
            </div>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleRemoveCode}
            className='text-green-600 hover:text-green-700'
          >
            <X className='w-4 h-4' />
          </Button>
        </div>
        {appliedDiscount && (
          <div className='az-body-sm text-green-700'>
            <p>Descuento: <strong>{appliedDiscount}%</strong></p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <label className='az-body-sm-bold text-az-ink-deep'>Código Promocional (opcional)</label>
      <div className='flex gap-2'>
        <Input
          type='text'
          placeholder='Ingresa tu código'
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
            setSuccess('');
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleApplyCode();
            }
          }}
          className={cn(
            'bg-az-canvas border-az-hairline-soft rounded-az-lg text-az-ink h-11',
            error && 'border-red-400 focus-visible:ring-red-200'
          )}
        />
        <Button
          type='button'
          onClick={handleApplyCode}
          disabled={isPending || !code.trim()}
          variant='outline'
          className='h-11'
        >
          {isPending ? <Loader className='w-4 h-4 animate-spin' /> : 'Aplicar'}
        </Button>
      </div>

      {error && (
        <div className='flex items-start gap-2 bg-red-50 p-3 rounded-az-lg'>
          <X className='w-4 h-4 text-red-600 mt-0.5 flex-shrink-0' />
          <p className='az-caption text-red-700'>{error}</p>
        </div>
      )}

      {success && (
        <div className='flex items-start gap-2 bg-green-50 p-3 rounded-az-lg'>
          <Check className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
          <p className='az-caption text-green-700'>{success}</p>
        </div>
      )}
    </div>
  );
}
