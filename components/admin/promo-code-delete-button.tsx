'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { deletePromoCode } from '@/lib/actions/promo-code.actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface PromoCodeDeleteButtonProps {
  codeId: string;
  codeName: string;
}

export default function PromoCodeDeleteButton({ codeId, codeName }: PromoCodeDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deletePromoCode(codeId);
      if (result.success) {
        toast({
          description: result.message,
          variant: 'default',
        });
        setIsOpen(false);
        router.refresh();
      } else {
        toast({
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        description: 'Error al eliminar el código',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
        >
          <Trash2 className='w-4 h-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar código promocional</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres eliminar el código{' '}
            <strong className='text-az-ink'>{codeName}</strong>? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='flex gap-3 justify-end'>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className='bg-red-600 hover:bg-red-700'
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
