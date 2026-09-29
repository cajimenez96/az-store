'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';

export default function OrderFilters({
  currentQuery,
  currentStatus,
  currentPaymentMethod,
}: {
  currentQuery: string;
  currentStatus: string;
  currentPaymentMethod: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(currentQuery);
  const [status, setStatus] = useState(currentStatus);
  const [paymentMethod, setPaymentMethod] = useState(currentPaymentMethod);

  useEffect(() => {
    setQuery(currentQuery);
    setStatus(currentStatus);
    setPaymentMethod(currentPaymentMethod);
  }, [currentQuery, currentStatus, currentPaymentMethod]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (query) params.set('query', query);
    else params.delete('query');

    if (status && status !== 'all') params.set('status', status);
    else params.delete('status');

    if (paymentMethod && paymentMethod !== 'all') params.set('paymentMethod', paymentMethod);
    else params.delete('paymentMethod');

    params.set('page', '1');
    router.push(`/admin/orders?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/admin/orders');
  };

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 mb-6 space-y-4 shadow-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#707072] mb-1.5 block">Búsqueda</label>
          <Input
            placeholder="Buscar por comprador..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="h-10 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#707072] mb-1.5 block">Estado</label>
          <select
            className="flex h-10 w-full rounded-full border border-transparent bg-[#f5f5f5] px-4 py-2 text-xs font-medium text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus:bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagados</option>
            <option value="delivered">Entregados</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#707072] mb-1.5 block">Método de Pago</label>
          <select
            className="flex h-10 w-full rounded-full border border-transparent bg-[#f5f5f5] px-4 py-2 text-xs font-medium text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus:bg-white"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="all">Todos los métodos</option>
            <option value="TransferenciaBancaria">Transferencia Bancaria</option>
            <option value="MercadoPago">Mercado Pago</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button
          variant="outline"
          onClick={clearFilters}
          className="h-9 px-5 rounded-full text-xs font-semibold uppercase tracking-wider border border-[#e5e5e5] text-[#111111] hover:bg-[#f5f5f5]"
        >
          Limpiar Filtros
        </Button>
        <Button
          onClick={applyFilters}
          className="h-9 px-6 rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider"
        >
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
