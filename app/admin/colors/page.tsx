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
    <div className='space-y-8 max-w-7xl mx-auto'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]'>
        <div>
          <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>Colores</h1>
          <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1'>
            Paleta global de colores del catálogo. Se reúsan entre productos.
          </p>
        </div>
        <Button asChild className='rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider px-6 h-10'>
          <Link href='/admin/colors/create'>+ Color</Link>
        </Button>
      </div>

      <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>COLOR</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>HEX</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>PRODUCTOS</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>ACCIONES</TableHead>
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
                  className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'
                >
                  <TableCell className='font-semibold text-sm text-[#111111] py-4'>
                    <div className='flex items-center gap-2.5'>
                      <span
                        className='inline-block w-4 h-4 rounded-full border border-[#e5e5e5] shadow-inner'
                        style={{ backgroundColor: color.hex }}
                        aria-hidden
                      />
                      {color.name}
                    </div>
                  </TableCell>
                  <TableCell className='text-xs text-[#707072] font-mono py-4'>
                    {color.hex}
                  </TableCell>
                  <TableCell className='text-sm font-semibold text-[#111111] py-4 tabular-nums'>
                    {usageCount}
                  </TableCell>
                  <TableCell className='py-4 text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button asChild variant='outline' size='sm' className='h-8 px-4 text-xs font-semibold uppercase tracking-wider rounded-full border border-[#e5e5e5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors'>
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
                  className='text-center py-6 text-xs font-semibold text-[#707072]'
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
