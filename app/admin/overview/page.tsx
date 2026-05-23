import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrderSummary } from '@/lib/actions/order.actions';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils';
import { BadgeDollarSign, Barcode, CreditCard, Users } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Charts from './charts';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import SettingForm from './setting-form';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Panel de Control',
};

const AdminOverviewPage = async () => {
  await requireAdminOrSeller();

  const summary = await getOrderSummary();

  return (
    <div className='space-y-2'>
      <h1 className='h2-bold'>Panel de Control</h1>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Ingresos Totales</CardTitle>
            <BadgeDollarSign />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(
                summary.totalSales._sum.totalPrice?.toString() || 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Ventas</CardTitle>
            <CreditCard />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.ordersCount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Clientes</CardTitle>
            <Users />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.usersCount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Productos</CardTitle>
            <Barcode />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.productsCount)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-amber-900'>Pendientes de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-amber-700'>
              {formatNumber(summary.pendingPaymentsCount)}
            </div>
            <p className="text-xs text-amber-600 mt-1">Órdenes a la espera de comprobantes</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-blue-900'>Pendientes de Envío</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-700'>
              {formatNumber(summary.pendingDeliveriesCount)}
            </div>
            <p className="text-xs text-blue-600 mt-1">Órdenes pagadas listas para enviar</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-red-900'>Stock Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-700'>
              {formatNumber(summary.criticalStockCount)}
            </div>
            <p className="text-xs text-red-600 mt-1">Talles con 2 o menos unidades</p>
          </CardContent>
        </Card>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <Charts
              data={{
                salesData: summary.salesData,
              }}
            />
          </CardContent>
        </Card>
        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>COMPRADOR</TableHead>
                  <TableHead>FECHA</TableHead>
                  <TableHead>TOTAL</TableHead>
                  <TableHead>ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.latestSales.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      {order?.user?.name ? order.user.name : 'Usuario Eliminado'}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(order.createdAt).dateOnly}
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                    <TableCell>
                      <Link href={`/order/${order.id}`}>
                        <Button variant="outline">
                          <span className='px-2'>Detalles</span>
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Tercera fila: Configuraciones y Desglose de Ingresos */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4'>
        <div className='col-span-3'>
          <SettingForm 
            settingKey="CRITICAL_STOCK_THRESHOLD"
            initialValue={summary.criticalStockThreshold.toString()}
            label="Límite de Stock Crítico"
            description="Las alertas se activarán cuando un talle llegue a esta cantidad o menos."
          />
        </div>
        
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Ingresos por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MÉTODO DE PAGO</TableHead>
                  <TableHead className='text-right'>INGRESOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.salesByMethod.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No hay datos de ingresos
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.salesByMethod.map((item) => {
                    const displayName =
                      item.paymentMethod === 'TransferenciaBancaria'
                        ? 'Transferencia Bancaria'
                        : item.paymentMethod === 'MercadoPago'
                        ? 'Mercado Pago'
                        : item.paymentMethod;
                    
                    return (
                      <TableRow key={item.paymentMethod}>
                        <TableCell className="font-medium">
                          {displayName}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.totalSales)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
