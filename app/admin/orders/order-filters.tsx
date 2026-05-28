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
    <div className="bg-az-surface-soft border border-az-hairline-soft rounded-az-xl p-4 mb-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="az-caption-bold uppercase text-az-stone mb-1 block">Búsqueda</label>
          <Input
            placeholder="Buscar por comprador..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>
        <div>
          <label className="az-caption-bold uppercase text-az-stone mb-1 block">Estado</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagados</option>
            <option value="delivered">Entregados</option>
          </select>
        </div>
        <div>
          <label className="az-caption-bold uppercase text-az-stone mb-1 block">Método de Pago</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="TransferenciaBancaria">Transferencia Bancaria</option>
            <option value="MercadoPago">Mercado Pago</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={clearFilters}>Limpiar Filtros</Button>
        <Button onClick={applyFilters}>Aplicar Filtros</Button>
      </div>
    </div>
  );
}
