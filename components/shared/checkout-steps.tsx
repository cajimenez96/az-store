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
              'py-2 px-5 rounded-full text-center transition-all font-sans text-xs sm:text-sm font-medium border w-full md:w-auto',
              index === current
                ? 'bg-nike-ink border-nike-ink text-white shadow-sm'
                : index < current
                ? 'bg-white border-nike-hairline text-nike-ink'
                : 'bg-nike-soft-cloud border-transparent text-nike-mute opacity-60'
            )}
          >
            <span className='mr-1.5 opacity-70'>
              {index + 1}.
            </span>
            {step}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'hidden md:block h-px w-6 flex-shrink-0',
                index < current ? 'bg-nike-ink' : 'bg-nike-hairline-soft'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CheckoutSteps;
