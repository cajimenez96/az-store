'use client';

import { useShippingMethod } from '@/hooks/use-shipping-method';
import { formatCurrency } from '@/lib/utils';

interface ShippingMethodSelectorProps {
  itemsPrice: string;
  freeShippingThreshold: number;
}

export default function ShippingMethodSelector({
  itemsPrice,
  freeShippingThreshold,
}: ShippingMethodSelectorProps) {
  const { shippingMethod, setShippingMethod } = useShippingMethod();
  const itemsPriceNum = parseFloat(itemsPrice);

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
    <div className='bg-az-canvas rounded-az-xxxl border border-az-hairline-soft p-6 space-y-4'>
      <h2 className='az-body-md-bold text-az-ink-deep border-b border-az-hairline-soft pb-4'>
        Tipo de Envío
      </h2>

      <div className='space-y-3'>
        {/* Retiro */}
        <label className='flex items-center gap-3 p-3 border border-az-hairline-soft rounded-az-lg hover:bg-az-surface-soft cursor-pointer transition-colors'>
          <input
            type='radio'
            name='shippingMethod'
            value='retiro'
            checked={shippingMethod === 'retiro'}
            onChange={(e) => setShippingMethod(e.target.value as 'retiro' | 'envio')}
            className='w-4 h-4'
          />
          <div className='flex-1'>
            <p className='az-body-sm-bold text-az-ink-deep'>Retiro en el local</p>
            <p className='az-caption text-az-stone'>Retira tu compra personalmente</p>
          </div>
          <span className='az-body-sm-bold text-az-primary'>Gratis</span>
        </label>

        {/* Envío a domicilio */}
        <label className='flex items-center gap-3 p-3 border border-az-hairline-soft rounded-az-lg hover:bg-az-surface-soft cursor-pointer transition-colors'>
          <input
            type='radio'
            name='shippingMethod'
            value='envio'
            checked={shippingMethod === 'envio'}
            onChange={(e) => setShippingMethod(e.target.value as 'retiro' | 'envio')}
            className='w-4 h-4'
          />
          <div className='flex-1'>
            <p className='az-body-sm-bold text-az-ink-deep'>Envío a domicilio</p>
            <p className='az-caption text-az-stone'>
              {itemsPriceNum >= freeShippingThreshold
                ? 'Envío gratis a todo el país'
                : 'Envío a cargo del cliente via Andreani'}
            </p>
          </div>
          <span className='az-body-sm-bold text-az-primary'>{shippingInfo.label}</span>
        </label>
      </div>

      {shippingMethod === 'envio' && itemsPriceNum < freeShippingThreshold && (
        <div className='bg-blue-50 border border-blue-200 rounded-az-lg p-3'>
          <p className='az-body-sm text-blue-900'>
            💡 El vendedor se pondrá en contacto para coordinar el envío y confirmar el costo.
          </p>
        </div>
      )}
    </div>
  );
}
