import React from 'react';
import { Metadata } from 'next';
import { getAllColors, deleteColor } from '@/lib/actions/color.actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DeleteDialog from '@/components/shared/delete-dialog';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Admin Colores',
};

export default async function AdminColorsPage() {
  await requireAdmin();
  const colors = await getAllColors();

  if (!colors) {
    return <div>Error al cargar los colores.</div>;
  }

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='h2-bold'>Colores</h1>
          <p className='az-body-sm text-az-stone mt-1'>
            Paleta global de colores del catálogo. Se reusan entre productos.
          </p>
        </div>
        <Button asChild variant='default'>
          <Link href='/admin/colors/create'>+ Color</Link>
        </Button>
      </div>

      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>COLOR</TableHead>
              <TableHead>HEX</TableHead>
              <TableHead>PRODUCTOS</TableHead>
              <TableHead className='w-[180px]'>ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {colors.map((color) => {
              const usageCount = color._count.productColors;
              const warningMessage =
                usageCount > 0
                  ? `Este color está siendo usado en ${usageCount} producto(s). No se puede eliminar.`
                  : undefined;

              return (
                <TableRow
                  key={color.id}
                  className='bg-az-surface-soft border-b border-az-hairline-soft'
                >
                  <TableCell className='font-medium text-az-ink-deep'>
                    <div className='flex items-center gap-2'>
                      <span
                        className='inline-block w-5 h-5 rounded-full border border-az-hairline'
                        style={{ backgroundColor: color.hex }}
                        aria-hidden
                      />
                      {color.name}
                    </div>
                  </TableCell>
                  <TableCell className='text-sm text-az-steel font-mono'>
                    {color.hex}
                  </TableCell>
                  <TableCell className='text-sm text-az-steel'>
                    {usageCount}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center gap-2'>
                      <Button asChild variant='outline' size='sm'>
                        <Link href={`/admin/colors/${color.id}`}>Editar</Link>
                      </Button>
                      <DeleteDialog
                        id={color.id}
                        action={deleteColor}
                        warningMessage={warningMessage}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {colors.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='text-center py-4 text-az-stone'
                >
                  No hay colores registrados. Creá el primero con el botón "+ Color".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
