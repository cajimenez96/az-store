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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="h2-bold">Banners Promocionales</h1>
        <Button asChild variant="default">
          <Link href="/admin/promotions/banners/create">+ Banner</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IMAGEN</TableHead>
              <TableHead>TÍTULO</TableHead>
              <TableHead>ORDEN</TableHead>
              <TableHead>ESTADO</TableHead>
              <TableHead>INICIO</TableHead>
              <TableHead>FIN</TableHead>
              <TableHead className="w-[180px]">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner) => {
              const now = new Date();
              const hasStarted = !banner.startsAt || banner.startsAt <= now;
              const hasEnded = banner.endsAt && banner.endsAt < now;

              return (
                <TableRow key={banner.id} className="bg-az-surface-soft border-b border-az-hairline-soft">
                  <TableCell>
                    <div className="relative w-16 h-10 rounded overflow-hidden bg-az-surface">
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-az-ink-deep">{banner.title}</TableCell>
                  <TableCell className="text-az-steel">{banner.order}</TableCell>
                  <TableCell>
                    {!banner.isActive ? (
                      <Badge variant="outline">Inactivo</Badge>
                    ) : hasEnded ? (
                      <Badge variant="destructive">Expirado</Badge>
                    ) : !hasStarted ? (
                      <Badge variant="secondary">Pendiente</Badge>
                    ) : (
                      <Badge variant="default">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-az-steel">
                    {banner.startsAt ? formatDateTime(banner.startsAt).dateTime : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-az-steel">
                    {banner.endsAt ? formatDateTime(banner.endsAt).dateTime : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
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
                <TableCell colSpan={7} className="text-center py-4 text-az-stone">
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
