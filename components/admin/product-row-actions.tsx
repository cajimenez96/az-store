'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { deleteProduct, toggleProductActive } from '@/lib/actions/product.actions';
import DeleteDialog from '@/components/shared/delete-dialog';

const BUTTON_BASE =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]';

const ProductRowActions = ({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleProductActive(id);

      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
        return;
      }

      toast({ description: res.message });
      router.refresh();
    });
  };

  const toggleLabel = isActive ? 'Ocultar al cliente' : 'Mostrar al cliente';

  return (
    <div className='flex items-center justify-end gap-2'>
      <button
        type='button'
        onClick={handleToggle}
        disabled={isPending}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={cn(
          BUTTON_BASE,
          isActive
            ? 'rounded-full border-[#007d48] bg-[#007d48] text-white hover:bg-[#006a3d]'
            : 'border-[#e5e5e5] bg-white text-[#707072] hover:bg-[#f5f5f5]',
        )}
      >
        {isActive ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
      </button>

      <Link
        href={`/admin/products/${id}`}
        aria-label='Editar producto'
        title='Editar producto'
        className={cn(
          BUTTON_BASE,
          'border-[#e5e5e5] bg-white text-[#111111] hover:bg-[#f5f5f5]',
        )}
      >
        <Pencil className='h-4 w-4' />
      </Link>

      <DeleteDialog
        id={id}
        action={deleteProduct}
        trigger={
          <button
            type='button'
            aria-label='Eliminar producto'
            title='Eliminar producto'
            className={cn(
              BUTTON_BASE,
              'border-[#e5e5e5] bg-white text-red-600 hover:bg-red-50',
            )}
          >
            <Trash2 className='h-4 w-4' />
          </button>
        }
      />
    </div>
  );
};

export default ProductRowActions;
