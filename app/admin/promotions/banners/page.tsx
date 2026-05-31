import React from 'react';
import { Metadata } from 'next';
import { getAllPromotions, deletePromotion } from '@/lib/actions/promotion.actions';
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

export const metadata: Metadata = {
  title: 'Banners Promocionales',
};

export default async function BannersPage() {
  await requireAdmin();
  const promotions = await getAllPromotions();

  if (!promotions) {
    return <div>Error al cargar los banners.</div>;
  }

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
              <TableHead>TÍTULO</TableHead>
              <TableHead>ESTADO</TableHead>
              <TableHead>INICIO</TableHead>
              <TableHead>FIN</TableHead>
              <TableHead className="w-[180px]">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((promotion) => {
              const isActive = promotion.isActive;
              const now = new Date();
              const hasStarted = !promotion.startsAt || promotion.startsAt <= now;
              const hasEnded = promotion.endsAt && promotion.endsAt < now;
              const isVisible = isActive && hasStarted && !hasEnded;

              return (
                <TableRow key={promotion.id} className="bg-az-surface-soft border-b border-az-hairline-soft">
                  <TableCell className="font-medium text-az-ink-deep">{promotion.title}</TableCell>
                  <TableCell>
                    {!isActive ? (
                      <Badge variant="outline">Inactiva</Badge>
                    ) : hasEnded ? (
                      <Badge variant="destructive">Expirada</Badge>
                    ) : !hasStarted ? (
                      <Badge variant="secondary">Pendiente</Badge>
                    ) : (
                      <Badge variant="default">Activa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-az-steel">
                    {promotion.startsAt ? formatDateTime(promotion.startsAt).dateTime : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-az-steel">
                    {promotion.endsAt ? formatDateTime(promotion.endsAt).dateTime : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/promotions/banners/${promotion.id}`}>Editar</Link>
                      </Button>
                      <DeleteDialog
                        id={promotion.id}
                        action={deletePromotion}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {promotions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-az-stone">
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
