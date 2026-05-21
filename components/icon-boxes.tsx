import { DollarSign, Headset, ShoppingBag, WalletCards } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const IconBoxes = () => {
  return (
    <div>
      <Card>
        <CardContent className='grid md:grid-cols-4 gap-4 p-4'>
          <div className='space-y-2'>
            <ShoppingBag />
            <div className='text-sm font-bold'>Envío Gratis</div>
            <div className='text-sm text-muted-foreground'>
              Envío sin cargo en compras superiores a $100
            </div>
          </div>
          <div className='space-y-2'>
            <DollarSign />
            <div className='text-sm font-bold'>Garantía de Devolución</div>
            <div className='text-sm text-muted-foreground'>
              Dentro de los 30 días de la compra
            </div>
          </div>
          <div className='space-y-2'>
            <WalletCards />
            <div className='text-sm font-bold'>Pago Flexible</div>
            <div className='text-sm text-muted-foreground'>
              Pagá con Mercado Pago o transferencia bancaria
            </div>
          </div>
          <div className='space-y-2'>
            <Headset />
            <div className='text-sm font-bold'>Soporte 24/7</div>
            <div className='text-sm text-muted-foreground'>
              Recibí asistencia en cualquier momento
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IconBoxes;
