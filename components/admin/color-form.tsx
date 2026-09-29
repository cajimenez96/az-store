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
          className='text-xs font-bold uppercase tracking-wider text-[#111111] mb-2 block'
        >
          Nombre del color
        </label>
        <Input
          id='color-name'
          name='name'
          placeholder='Ej: Azul marino'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className='bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11'
          required
        />
      </div>

      <div>
        <label className='text-xs font-bold uppercase tracking-wider text-[#111111] mb-2 block'>
          Valor hex
        </label>
        <ColorPickerField value={hex} onChange={setHex} />
        <p className='text-xs text-[#707072] mt-2'>
          Elegí un color de la paleta o ingresá el hex manualmente (formato #RRGGBB).
        </p>
      </div>

      <Button
        type='submit'
        disabled={isPending}
        className='w-full sm:w-auto bg-[#111111] hover:bg-black text-white rounded-full font-medium shadow-sm transition-all px-6 py-2.5 h-auto'
      >
        {isPending
          ? 'Guardando...'
          : `${type === 'Create' ? 'Crear' : 'Actualizar'} Color`}
      </Button>
    </form>
  );
}
