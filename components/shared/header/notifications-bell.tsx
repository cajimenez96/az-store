import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { prisma } from '@/db/prisma';
import { getSetting } from '@/lib/actions/setting.actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NotificationsBell = async () => {
  const criticalStockThresholdStr = await getSetting('CRITICAL_STOCK_THRESHOLD', '2');
  const criticalStockThreshold = parseInt(criticalStockThresholdStr, 10);

  const criticalStockCount = await prisma.productVariant.count({
    where: { stock: { lte: criticalStockThreshold } }
  });

  const pendingPaymentsCount = await prisma.order.count({
    where: { isPaid: false }
  });

  const totalNotifications = criticalStockCount + pendingPaymentsCount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative'>
          <Bell />
          {totalNotifications > 0 && (
            <div className="absolute top-1 right-2 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
              {totalNotifications > 99 ? '+99' : totalNotifications}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {totalNotifications === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No tienes notificaciones pendientes.
          </div>
        )}

        {criticalStockCount > 0 && (
          <DropdownMenuItem asChild>
            <Link href="/admin/inventory?stock=critical" className="cursor-pointer">
              <div className="flex flex-col">
                <span className="font-medium text-red-600">Stock Crítico</span>
                <span className="text-xs text-muted-foreground">Tienes {criticalStockCount} talle(s) con stock igual o menor a {criticalStockThreshold}.</span>
              </div>
            </Link>
          </DropdownMenuItem>
        )}

        {pendingPaymentsCount > 0 && (
          <DropdownMenuItem asChild>
            <Link href="/admin/orders?status=pending_payment" className="cursor-pointer">
              <div className="flex flex-col">
                <span className="font-medium text-amber-600">Pagos Pendientes</span>
                <span className="text-xs text-muted-foreground">Tienes {pendingPaymentsCount} orden(es) esperando pago.</span>
              </div>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsBell;
