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
    <div className='space-y-8 max-w-7xl mx-auto'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]'>
        <div>
          <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>
            Códigos de Descuento
          </h1>
          <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1'>
            Administrá cupones, porcentajes de descuento y límites de uso
          </p>
        </div>
        <Link href='/admin/promotions/discount-codes/create'>
          <Button className='rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider px-6 h-10'>
            <Plus className='w-4 h-4 mr-2' />
            Crear Código
          </Button>
        </Link>
      </div>

      {promoCodes.length === 0 ? (
        <div className='text-center py-12 bg-white rounded-2xl border border-[#e5e5e5] shadow-none'>
          <p className='text-xs font-semibold text-[#707072]'>
            No hay códigos de descuento creados
          </p>
          <Link href='/admin/promotions/discount-codes/create' className='mt-4 inline-block'>
            <Button variant='outline' className='rounded-full border border-[#e5e5e5] text-xs font-semibold uppercase tracking-wider text-[#111111] hover:bg-[#111111] hover:text-white'>
              Crear el primer código
            </Button>
          </Link>
        </div>
      ) : (
        <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none overflow-hidden'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>
                    Código
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>
                    Descripción
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-center'>
                    Desc. MP
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-center'>
                    Desc. Transf.
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-center'>
                    Estado
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>
                    Vigencia
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-center'>
                    Usos
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((code) => (
                  <TableRow
                    key={code.id}
                    className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'
                  >
                    <TableCell className='font-semibold text-sm font-mono text-[#111111] py-4'>
                      {code.code}
                    </TableCell>
                    <TableCell className='text-sm text-[#707072] py-4'>
                      {code.description || '—'}
                    </TableCell>
                    <TableCell className='text-sm font-semibold text-[#111111] text-center py-4 tabular-nums'>
                      {code.discountPercentMercadoPago != null
                        ? `${code.discountPercentMercadoPago}%`
                        : '—'}
                    </TableCell>
                    <TableCell className='text-sm font-semibold text-[#111111] text-center py-4 tabular-nums'>
                      {code.discountPercentTransferencia != null
                        ? `${code.discountPercentTransferencia}%`
                        : '—'}
                    </TableCell>
                    <TableCell className='py-4 text-center'>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          code.isActive
                            ? 'bg-[#dcfce7] text-[#007d48]'
                            : 'bg-[#f5f5f5] text-[#707072]'
                        }`}
                      >
                        {code.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className='text-xs text-[#707072] py-4 tabular-nums'>
                      {code.startsAt || code.endsAt ? (
                        <div className='space-y-0.5'>
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
                    <TableCell className='text-sm font-semibold text-[#111111] text-center py-4 tabular-nums'>
                      {code.usageHistory?.length || 0}
                      {code.maxUsesPerUser && ` / ${code.maxUsesPerUser}`}
                    </TableCell>
                    <TableCell className='py-4 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Link
                          href={`/admin/promotions/discount-codes/${code.id}`}
                        >
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 px-3 rounded-full border border-[#e5e5e5] text-xs font-semibold uppercase tracking-wider text-[#111111] hover:bg-[#111111] hover:text-white transition-colors'
                          >
                            <Edit className='w-3.5 h-3.5 mr-1' />
                            Editar
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
