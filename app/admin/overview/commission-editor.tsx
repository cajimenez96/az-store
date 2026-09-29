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
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 rounded-full hover:bg-[#f5f5f5] text-[#111111]'
        onClick={() => setOpen(true)}
      >
        <Pencil className='h-3.5 w-3.5' />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='bg-white border-[#e5e5e5] rounded-2xl max-w-sm p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-medium tracking-tight text-[#111111] font-marder-display'>
              Comisión de {sellerName}
            </DialogTitle>
          </DialogHeader>
          <div className='py-4 space-y-2'>
            <label className='text-xs font-semibold uppercase tracking-wider text-[#707072] block'>
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
                className='bg-[#f5f5f5] border-transparent rounded-full text-sm font-medium text-[#111111] focus-visible:ring-2 focus-visible:ring-[#111111] focus:bg-white w-28'
              />
              <span className='text-sm font-semibold text-[#707072]'>%</span>
            </div>
          </div>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='ghost'
              className='rounded-full text-xs font-semibold uppercase tracking-wider text-[#707072] hover:bg-[#f5f5f5]'
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className='rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider px-6'
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
