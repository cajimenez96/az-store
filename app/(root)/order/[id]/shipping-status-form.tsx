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
    <div className="mt-4 p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-3">
      <h3 className="font-semibold text-zinc-900 text-sm">Actualizar Estado de Envío (Administrador)</h3>
      <div className="space-y-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full text-sm p-2 rounded border border-zinc-300 bg-white"
        >
          <option value="Pendiente">Pendiente</option>
          <option value="Preparando">Preparando</option>
          <option value="Enviado">Enviado</option>
          <option value="Entregado">Entregado</option>
        </select>
        <textarea
          placeholder="Notas adicionales (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-sm p-2 rounded border border-zinc-300 bg-white resize-none"
          rows={2}
        />
        <Button
          type="button"
          disabled={isPending}
          onClick={handleUpdate}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isPending ? 'Guardando...' : 'Actualizar Envío'}
        </Button>
      </div>
    </div>
  );
}
