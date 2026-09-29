import React from 'react';
import { Metadata } from 'next';
import {
  getAllBrands,
  deleteBrand,
} from '@/lib/actions/brand.actions';
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
import { Badge } from '@/components/ui/badge';
import DeleteDialog from '@/components/shared/delete-dialog';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { DEFAULT_BRAND_ID } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Admin Marcas',
};

export default async function AdminBrandsPage() {
  await requireAdminOrSeller();
  const brands = await getAllBrands();

  if (!brands) {
    return <div>Error al cargar las marcas.</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display">Marcas</h1>
          <p className="text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1">Fabricantes y marcas del catálogo</p>
        </div>
        <Button asChild className="rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider px-6 h-10">
          <Link href="/admin/brands/create">+ Marca</Link>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#e5e5e5] hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">MARCA</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">SLUG</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">PRODUCTOS</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => {
              const isDefault = brand.id === DEFAULT_BRAND_ID;
              const productCount = brand._count.products;
              const warningMessage =
                productCount > 0
                  ? `Esta marca tiene ${productCount} producto${productCount !== 1 ? 's' : ''}. Serán reasignados a "Sin marca".`
                  : undefined;

              return (
                <TableRow key={brand.id} className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <TableCell className="font-semibold text-sm text-[#111111] py-4">{brand.name}</TableCell>
                  <TableCell className="text-xs text-[#707072] font-mono py-4">{brand.slug}</TableCell>
                  <TableCell className="text-sm font-semibold text-[#111111] py-4 tabular-nums">{productCount}</TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isDefault ? (
                        <Badge variant="secondary" className="rounded-full text-xs">Predeterminada</Badge>
                      ) : (
                        <>
                          <Button asChild variant="outline" size="sm" className="h-8 px-4 text-xs font-semibold uppercase tracking-wider rounded-full border border-[#e5e5e5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors">
                            <Link href={`/admin/brands/${brand.id}`}>Editar</Link>
                          </Button>
                          <DeleteDialog
                            id={brand.id}
                            action={deleteBrand}
                            warningMessage={warningMessage}
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {brands.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-xs font-semibold text-[#707072]">
                  No hay marcas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
