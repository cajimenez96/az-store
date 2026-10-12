'use client';
import { useState, useTransition, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

const DeleteDialog = ({
  id,
  action,
  warningMessage,
  trigger,
}: {
  id: string;
  action: (id: string) => Promise<{ success: boolean; message: string }>;
  warningMessage?: string;
  // Optional custom trigger element; defaults to the "Eliminar" button.
  trigger?: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDeleteClick = () => {
    startTransition(async () => {
      const res = await action(id);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
      } else {
        setOpen(false);
        toast({
          description: res.message,
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button
            size='sm'
            variant='ghost'
            className='ml-2 min-h-9 rounded-nike-full bg-nike-soft-cloud px-4 font-medium text-nike-ink shadow-none hover:bg-nike-hairline-soft'
          >
            Eliminar
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className='rounded-nike-md border-nike-hairline-soft bg-white shadow-none'>
        <AlertDialogHeader>
          <AlertDialogTitle className='font-sans text-nike-ink'>
            ¿Estás absolutamente seguro?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='text-nike-mute'>
              <span>Esta acción no se puede deshacer.</span>
              {warningMessage && (
                <span className='mt-3 block rounded-nike-sm bg-nike-soft-cloud px-4 py-3 font-medium text-nike-ink'>
                  {warningMessage}
                </span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='gap-2'>
          <AlertDialogCancel className='mt-0 min-h-11 rounded-nike-full border-0 bg-nike-soft-cloud px-5 font-medium text-nike-ink shadow-none hover:bg-nike-hairline-soft'>
            Cancelar
          </AlertDialogCancel>
          <Button
            size='sm'
            disabled={isPending}
            onClick={handleDeleteClick}
            className='min-h-11 rounded-nike-full bg-nike-ink px-5 font-medium text-white shadow-none hover:bg-nike-charcoal'
          >
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
