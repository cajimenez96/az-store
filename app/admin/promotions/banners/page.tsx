import React from 'react';
import { Metadata } from 'next';
import { getAllPromoBanners, deletePromoBanner } from '@/lib/actions/promo-banner.actions';
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
import { requireAdmin } from '@/lib/auth-guard';
import { formatDateTime } from '@/lib/utils';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Banners Promocionales',
};

export default async function BannersPage() {
  await requireAdmin();
  const banners = await getAllPromoBanners();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display">Banners Promocionales</h1>
          <p className="text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1">Banners cinematográficos y campañas destacadas</p>
        </div>
        <Button asChild className="rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider px-6 h-10">
          <Link href="/admin/promotions/banners/create">+ Banner</Link>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#e5e5e5] hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">IMAGEN</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">TÍTULO</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">ORDEN</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">ESTADO</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">INICIO</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10">FIN</TableHead>
              <TableHead className="text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner) => {
              const now = new Date();
              const hasStarted = !banner.startsAt || banner.startsAt <= now;
              const hasEnded = banner.endsAt && banner.endsAt < now;

              return (
                <TableRow key={banner.id} className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <TableCell className="py-4">
                    <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-[#f5f5f5] border border-[#e5e5e5]">
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-[#111111] py-4">{banner.title}</TableCell>
                  <TableCell className="text-sm text-[#707072] py-4 tabular-nums">{banner.order}</TableCell>
                  <TableCell className="py-4">
                    {!banner.isActive ? (
                      <Badge variant="outline" className="rounded-full text-[11px] font-semibold text-[#707072] border-[#e5e5e5]">Inactivo</Badge>
                    ) : hasEnded ? (
                      <Badge variant="destructive" className="rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#d30005] hover:bg-[#fee2e2] border-0">Expirado</Badge>
                    ) : !hasStarted ? (
                      <Badge variant="secondary" className="rounded-full text-[11px] font-semibold bg-[#fef3c7] text-[#d97706] hover:bg-[#fef3c7] border-0">Pendiente</Badge>
                    ) : (
                      <Badge variant="default" className="rounded-full text-[11px] font-semibold bg-[#111111] text-white hover:bg-black">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-[#707072] py-4 tabular-nums">
                    {banner.startsAt ? formatDateTime(banner.startsAt).dateTime : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-[#707072] py-4 tabular-nums">
                    {banner.endsAt ? formatDateTime(banner.endsAt).dateTime : '—'}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm" className="h-8 px-4 text-xs font-semibold uppercase tracking-wider rounded-full border border-[#e5e5e5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors">
                        <Link href={`/admin/promotions/banners/${banner.id}`}>Editar</Link>
                      </Button>
                      <DeleteDialog id={banner.id} action={deletePromoBanner} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {banners.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-xs font-semibold text-[#707072]">
                  No hay banners registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
