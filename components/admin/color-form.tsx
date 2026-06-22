'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createColor, updateColor } from '@/lib/actions/color.actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ColorPickerField } from '@/components/admin/color-picker-field';
import { Color } from '@prisma/client';

export default function ColorForm({
  type,
  color,
}: {
  type: 'Create' | 'Update';
  color?: Color;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(color?.name ?? '');
  const [hex, setHex] = useState(color?.hex ?? '#000000');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      toast({
        variant: 'destructive',
        description: 'Completá el nombre y un hex válido (#RRGGBB).',
      });
      return;
    }

    startTransition(async () => {
      const res =
        type === 'Create'
          ? await createColor({ name, hex })
          : await updateColor({ id: color!.id, name, hex });

      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/colors');
      }
    });
  }

  return (
    <form
      method='POST'
      noValidate
      onSubmit={onSubmit}
      className='space-y-6'
    >
      <div>
        <label
          htmlFor='color-name'
          className='text-sm font-medium leading-none mb-2 block'
        >
          Nombre del color
        </label>
        <Input
          id='color-name'
          name='name'
          placeholder='Ej: Azul marino'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className='text-sm font-medium leading-none mb-2 block'>
          Valor hex
        </label>
        <ColorPickerField value={hex} onChange={setHex} />
        <p className='az-caption text-az-stone mt-2'>
          Elegí un color de la paleta o ingresá el hex manualmente (formato #RRGGBB).
        </p>
      </div>

      <Button
        type='submit'
        size='lg'
        disabled={isPending}
        className='w-full sm:w-auto'
      >
        {isPending
          ? 'Guardando...'
          : `${type === 'Create' ? 'Crear' : 'Actualizar'} Color`}
      </Button>
    </form>
  );
}
