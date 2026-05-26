import React from 'react';
import { cn } from '@/lib/utils';

const CheckoutSteps = ({ current = 0 }) => {
  const steps = ['Iniciar Sesión', 'Dirección de Envío', 'Método de Pago', 'Confirmar Pedido'];

  return (
    <div className='flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 mb-10 w-full max-w-4xl mx-auto px-4'>
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={cn(
              'py-2 px-5 rounded-az-full text-center transition-all duration-200 border w-full md:w-auto',
              index === current
                ? 'bg-az-canvas border-az-primary text-az-primary az-body-sm-bold shadow-sm'
                : index < current
                ? 'bg-az-canvas border-az-hairline-soft text-az-ink az-body-sm'
                : 'bg-az-surface-soft border-az-hairline-soft text-az-stone az-caption'
            )}
          >
            <span
              className={cn(
                'mr-1.5 font-mono text-xs',
                index === current ? 'opacity-100' : 'opacity-50'
              )}
            >
              {index + 1}.
            </span>
            {step}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'hidden md:block h-px w-8 flex-shrink-0',
                index < current ? 'bg-az-primary/40' : 'bg-az-hairline-soft'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CheckoutSteps;
