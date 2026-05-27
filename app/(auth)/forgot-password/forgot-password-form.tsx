'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { requestPasswordReset } from '@/lib/actions/auth.actions';
import { useState } from 'react';

const inputClass =
  'bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0';
const labelClass = 'az-body-sm-bold text-az-ink-deep';

export default function ForgotPasswordForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await requestPasswordReset(email.trim().toLowerCase());

    if (result.success) {
      setIsSubmitted(true);
      toast({
        description: result.message,
        variant: 'default',
      });
      setEmail('');
    } else {
      toast({
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className='space-y-4 p-6 bg-az-surface-soft border border-az-hairline-soft rounded-az-lg'>
        <div className='flex justify-center'>
          <div className='w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center'>
            <svg
              className='w-6 h-6 text-emerald-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>
        </div>

        <h3 className='az-body-lg-bold text-az-ink-deep text-center'>
          Email enviado
        </h3>

        <p className='az-body-sm text-az-stone text-center'>
          Si el email existe en nuestro sistema, recibirás un link para
          restablecer tu contraseña en los próximos minutos.
        </p>

        <p className='az-body-sm text-az-stone text-center'>
          No olvides revisar tu carpeta de spam si no lo ves en la bandeja de
          entrada.
        </p>

        <Button
          onClick={() => setIsSubmitted(false)}
          variant='outlineLight'
          className='w-full'
        >
          Intentar con otro email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-1.5'>
        <Label className={labelClass}>Email</Label>
        <Input
          type='email'
          placeholder='tu@email.com'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
          disabled={isLoading}
        />
      </div>

      <Button
        type='submit'
        variant='buyCta'
        className='w-full'
        disabled={isLoading || !email.trim()}
      >
        {isLoading ? 'Enviando...' : 'Enviar link de reset'}
      </Button>
    </form>
  );
}
