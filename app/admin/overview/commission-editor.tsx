'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { updateSellerCommission } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { Pencil } from 'lucide-react';

interface Props {
  sellerId: string;
  sellerName: string;
  currentRate: number | null;
}

export default function CommissionEditor({ sellerId, sellerName, currentRate }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(
    String(currentRate != null ? Math.round(currentRate * 100) : '')
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const pct = parseFloat(value);
    if (isNaN(pct)) return;
    setLoading(true);
    const res = await updateSellerCommission(sellerId, pct);
    setLoading(false);
    toast({ description: res.message, variant: res.success ? 'default' : 'destructive' });
    if (res.success) setOpen(false);
  };

  return (
    <>
      <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => setOpen(true)}>
        <Pencil className='h-3.5 w-3.5' />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='bg-az-canvas border-az-hairline-soft max-w-sm'>
          <DialogHeader>
            <DialogTitle className='az-body-lg-bold text-az-ink-deep'>
              Comisión de {sellerName}
            </DialogTitle>
          </DialogHeader>
          <div className='py-4 space-y-2'>
            <label className='az-body-sm-bold text-az-ink-deep block'>
              Porcentaje de comisión
            </label>
            <div className='flex items-center gap-2'>
              <Input
                type='number'
                min={0}
                max={100}
                step={0.5}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0 w-28'
              />
              <span className='az-body-sm text-az-stone'>%</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant='buyCta' onClick={handleSave} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
