'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { updateShippingStatus } from '@/lib/actions/order.actions';

export default function ShippingStatusForm({
  orderId,
  currentStatus,
  currentNotes,
}: {
  orderId: string;
  currentStatus: string;
  currentNotes: string | null;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes || '');

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updateShippingStatus(orderId, status, notes);
      toast({
        variant: res.success ? 'default' : 'destructive',
        description: res.message,
      });
    });
  };

  return (
    <div className="mt-4 p-4 rounded-az-xl bg-az-surface-soft border border-az-hairline-soft space-y-3">
      <h3 className="az-body-sm-bold text-az-ink-deep">Actualizar Estado de Envío (Administrador)</h3>
      <div className="space-y-2">
        <label className="az-caption-bold text-az-stone uppercase tracking-wider block">Nuevo Estado</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full text-sm p-2 rounded-az-lg border border-az-hairline-soft bg-az-canvas focus:ring-1 focus:ring-az-primary focus:border-az-primary outline-none"
        >
          <option value="Pendiente">Pendiente</option>
          <option value="En Preparacion">En Preparación</option>
          <option value="En Camino">En Camino</option>
          <option value="Entregado">Entregado</option>
        </select>
        <textarea
          placeholder="Ej: Despachado por Andreani, número de guía 123456789..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-sm p-2 rounded-az-lg border border-az-hairline-soft bg-az-canvas resize-none focus:ring-1 focus:ring-az-primary focus:border-az-primary outline-none"
          rows={2}
        />
        <Button
          type="button"
          disabled={isPending}
          onClick={handleUpdate}
          variant="outline"
          size="sm"
          className="w-full rounded-az-full"
        >
          {isPending ? 'Guardando...' : 'Actualizar Envío'}
        </Button>
      </div>
    </div>
  );
}
