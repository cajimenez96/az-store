'use client';

import { useShippingMethod } from '@/hooks/use-shipping-method';

interface ShippingMethodSelectorProps {
  itemsPrice: number;
  freeShippingThreshold: number;
}

export default function ShippingMethodSelector({
  itemsPrice,
  freeShippingThreshold,
}: ShippingMethodSelectorProps) {
  const { shippingMethod, setShippingMethod } = useShippingMethod();
  const itemsPriceNum = itemsPrice;

  const getShippingInfo = () => {
    if (shippingMethod === 'retiro') {
      return { price: 0, label: 'Gratis' };
    }

    // envio
    if (itemsPriceNum >= freeShippingThreshold) {
      return { price: 0, label: 'Gratis' };
    }

    return { price: null, label: 'A cargo del cliente' };
  };

  const shippingInfo = getShippingInfo();

  return (
    <div className='bg-white border border-nike-hairline-soft p-6 space-y-4'>
      <h2 className='text-sm font-medium uppercase tracking-wider text-nike-ink border-b border-nike-hairline-soft pb-4'>
        Tipo de Envío
      </h2>

      <div className='space-y-3'>
        {/* Retiro */}
        <label
          className={`flex items-center gap-3.5 p-4 min-h-14 border cursor-pointer transition-all ${
            shippingMethod === 'retiro'
              ? 'border-nike-ink bg-nike-soft-cloud'
              : 'border-nike-hairline-soft bg-white hover:bg-nike-soft-cloud'
          }`}
        >
          <input
            type='radio'
            name='shippingMethod'
            value='retiro'
            checked={shippingMethod === 'retiro'}
            onChange={(e) => setShippingMethod(e.target.value as 'retiro' | 'envio')}
            className='w-5 h-5 accent-nike-ink focus:ring-nike-ink'
          />
          <div className='flex-1'>
            <p className='text-sm font-semibold text-nike-ink'>Retiro en el local</p>
            <p className='text-xs text-nike-mute'>Retirá tu compra personalmente sin cargo</p>
          </div>
          <span className='text-xs font-medium text-nike-ink bg-white border border-nike-hairline-soft px-3 py-1 rounded-nike-lg'>
            Gratis
          </span>
        </label>

        {/* Envío a domicilio */}
        <label
          className={`flex items-center gap-3.5 p-4 min-h-14 border cursor-pointer transition-all ${
            shippingMethod === 'envio'
              ? 'border-nike-ink bg-nike-soft-cloud'
              : 'border-nike-hairline-soft bg-white hover:bg-nike-soft-cloud'
          }`}
        >
          <input
            type='radio'
            name='shippingMethod'
            value='envio'
            checked={shippingMethod === 'envio'}
            onChange={(e) => setShippingMethod(e.target.value as 'retiro' | 'envio')}
            className='w-5 h-5 accent-nike-ink focus:ring-nike-ink'
          />
          <div className='flex-1'>
            <p className='text-sm font-semibold text-nike-ink'>Envío a domicilio</p>
            <p className='text-xs text-nike-mute'>
              {itemsPriceNum >= freeShippingThreshold
                ? 'Envío gratis a todo el país'
                : 'Envío a cargo del cliente vía Andreani'}
            </p>
          </div>
          <span className='text-xs font-medium text-nike-ink bg-white border border-nike-hairline-soft px-3 py-1 rounded-nike-lg'>
            {shippingInfo.label}
          </span>
        </label>
      </div>

      {shippingMethod === 'envio' && itemsPriceNum < freeShippingThreshold && (
        <div className='bg-nike-soft-cloud p-4'>
          <p className='text-xs text-nike-charcoal'>
            El vendedor se pondrá en contacto para coordinar el despacho y confirmar el costo del envío.
          </p>
        </div>
      )}
    </div>
  );
}
