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
    <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-4 shadow-sm'>
      <h2 className='text-sm font-bold uppercase tracking-wider text-nike-ink border-b border-[#e5e5e5] pb-4'>
        Tipo de Envío
      </h2>

      <div className='space-y-3'>
        {/* Retiro */}
        <label
          className={`flex items-center gap-3.5 p-4 border rounded-xl cursor-pointer transition-all ${
            shippingMethod === 'retiro'
              ? 'border-nike-ink bg-[#f5f5f5]'
              : 'border-[#e5e5e5] bg-white hover:bg-[#fafafa]'
          }`}
        >
          <input
            type='radio'
            name='shippingMethod'
            value='retiro'
            checked={shippingMethod === 'retiro'}
            onChange={(e) => setShippingMethod(e.target.value as 'retiro' | 'envio')}
            className='w-4 h-4 text-nike-ink focus:ring-nike-ink'
          />
          <div className='flex-1'>
            <p className='text-sm font-semibold text-nike-ink'>Retiro en el local</p>
            <p className='text-xs text-[#757575]'>Retirá tu compra personalmente sin cargo</p>
          </div>
          <span className='text-xs font-semibold text-nike-ink bg-white border border-[#e5e5e5] px-2.5 py-1 rounded-full'>
            Gratis
          </span>
        </label>

        {/* Envío a domicilio */}
        <label
          className={`flex items-center gap-3.5 p-4 border rounded-xl cursor-pointer transition-all ${
            shippingMethod === 'envio'
              ? 'border-nike-ink bg-[#f5f5f5]'
              : 'border-[#e5e5e5] bg-white hover:bg-[#fafafa]'
          }`}
        >
          <input
            type='radio'
            name='shippingMethod'
            value='envio'
            checked={shippingMethod === 'envio'}
            onChange={(e) => setShippingMethod(e.target.value as 'retiro' | 'envio')}
            className='w-4 h-4 text-nike-ink focus:ring-nike-ink'
          />
          <div className='flex-1'>
            <p className='text-sm font-semibold text-nike-ink'>Envío a domicilio</p>
            <p className='text-xs text-[#757575]'>
              {itemsPriceNum >= freeShippingThreshold
                ? 'Envío gratis a todo el país'
                : 'Envío a cargo del cliente vía Andreani'}
            </p>
          </div>
          <span className='text-xs font-semibold text-nike-ink bg-white border border-[#e5e5e5] px-2.5 py-1 rounded-full'>
            {shippingInfo.label}
          </span>
        </label>
      </div>

      {shippingMethod === 'envio' && itemsPriceNum < freeShippingThreshold && (
        <div className='bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl p-3.5'>
          <p className='text-xs text-[#484848]'>
            💡 El vendedor se pondrá en contacto para coordinar el despacho y confirmar el costo del envío.
          </p>
        </div>
      )}
    </div>
  );
}
