import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPromoCodes } from '@/lib/actions/promo-code.actions';
import { formatDateTime } from '@/lib/utils';
import { Edit, Plus } from 'lucide-react';
import PromoCodeDeleteButton from '@/components/admin/promo-code-delete-button';

export const metadata: Metadata = {
  title: 'Códigos de Descuento',
};

export default async function PromoCodesPage() {
  await requireAdmin();
  const promoCodes = await getPromoCodes();

  return (
    <div className='space-y-6 max-w-6xl mx-auto'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='az-heading-sm text-az-ink-deep'>
            Códigos de Descuento
          </h1>
          <p className='az-body-sm text-az-steel mt-1'>
            Administra códigos promocionales y sus descuentos
          </p>
        </div>
        <Link href='/admin/promotions/discount-codes/create'>
          <Button variant='buyCta' size='lg'>
            <Plus className='w-4 h-4 mr-2' />
            Crear Código
          </Button>
        </Link>
      </div>

      {promoCodes.length === 0 ? (
        <div className='text-center py-12 bg-az-canvas rounded-az-xxxl border border-az-hairline-soft'>
          <p className='az-body-sm text-az-steel'>
            No hay códigos de descuento creados
          </p>
          <Link href='/admin/promotions/discount-codes/create' className='mt-4'>
            <Button variant='outline'>Crear el primer código</Button>
          </Link>
        </div>
      ) : (
        <div className='bg-az-canvas rounded-az-xxxl border border-az-hairline-soft overflow-hidden'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='az-body-sm-bold text-az-ink'>
                    Código
                  </TableHead>
                  <TableHead className='az-body-sm-bold text-az-ink'>
                    Descripción
                  </TableHead>
                  <TableHead className='az-body-sm-bold text-az-ink text-center'>
                    Descuento MP
                  </TableHead>
                  <TableHead className='az-body-sm-bold text-az-ink text-center'>
                    Descuento Transf.
                  </TableHead>
                  <TableHead className='az-body-sm-bold text-az-ink text-center'>
                    Estado
                  </TableHead>
                  <TableHead className='az-body-sm-bold text-az-ink'>
                    Vigencia
                  </TableHead>
                  <TableHead className='az-body-sm-bold text-az-ink text-center'>
                    Usos
                  </TableHead>
                  <TableHead className='az-body-sm-bold text-az-ink text-right'>
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((code) => (
                  <TableRow
                    key={code.id}
                    className='border-b border-az-hairline-soft last:border-0 hover:bg-az-surface-soft/50 transition-colors'
                  >
                    <TableCell className='az-body-sm-bold text-az-ink-deep py-4'>
                      {code.code}
                    </TableCell>
                    <TableCell className='az-body-sm text-az-charcoal py-4'>
                      {code.description || '—'}
                    </TableCell>
                    <TableCell className='az-body-sm-bold text-az-ink-deep text-center py-4'>
                      {code.discountPercentMercadoPago != null
                        ? `${code.discountPercentMercadoPago}%`
                        : '—'}
                    </TableCell>
                    <TableCell className='az-body-sm-bold text-az-ink-deep text-center py-4'>
                      {code.discountPercentTransferencia != null
                        ? `${code.discountPercentTransferencia}%`
                        : '—'}
                    </TableCell>
                    <TableCell className='py-4 text-center'>
                      <span
                        className={`az-caption font-medium px-2 py-1 rounded-az-md ${
                          code.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {code.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className='az-body-sm text-az-charcoal py-4'>
                      {code.startsAt || code.endsAt ? (
                        <div className='space-y-1'>
                          {code.startsAt && (
                            <div>
                              Desde:{' '}
                              {formatDateTime(new Date(code.startsAt)).dateTime}
                            </div>
                          )}
                          {code.endsAt && (
                            <div>
                              Hasta:{' '}
                              {formatDateTime(new Date(code.endsAt)).dateTime}
                            </div>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className='az-body-sm text-az-charcoal text-center py-4'>
                      {code.usageHistory?.length || 0}
                      {code.maxUsesPerUser && ` / ${code.maxUsesPerUser}`}
                    </TableCell>
                    <TableCell className='py-4 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Link
                          href={`/admin/promotions/discount-codes/${code.id}`}
                        >
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-az-steel hover:text-az-ink-deep'
                          >
                            <Edit className='w-4 h-4' />
                          </Button>
                        </Link>
                        <PromoCodeDeleteButton
                          codeId={code.id}
                          codeName={code.code}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
