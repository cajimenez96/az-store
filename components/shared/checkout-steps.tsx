import React from 'react';
import { cn } from '@/lib/utils';

const CheckoutSteps = ({ current = 0 }) => {
  return (
    <div className='flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mb-10 w-full max-w-4xl mx-auto px-4'>
      {['Iniciar Sesión', 'Dirección de Envío', 'Método de Pago', 'Confirmar Pedido'].map(
        (step, index) => (
          <React.Fragment key={step}>
            <div
              className={cn(
                'py-2.5 px-6 rounded-full text-center text-sm transition-all duration-200 border w-full md:w-auto min-w-[160px]',
                index === current
                  ? 'bg-aloe-10 border-transparent text-black font-semibold shadow-sm'
                  : index < current
                  ? 'bg-white border-hairline-light text-zinc-800 font-medium'
                  : 'bg-zinc-50 border-hairline-light text-zinc-400'
              )}
            >
              <span className='mr-1.5 text-xs opacity-70 font-mono'>{index + 1}.</span>
              {step}
            </div>
            {step !== 'Confirmar Pedido' && (
              <div className='hidden md:block h-px w-10 bg-zinc-300' />
            )}
          </React.Fragment>
        )
      )}
    </div>
  );
};

export default CheckoutSteps;
