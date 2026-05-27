import { DollarSign, Headset, ShoppingBag, WalletCards } from 'lucide-react';

const features = [
  {
    icon: ShoppingBag,
    title: 'Envío Gratis',
    description: 'En compras superiores a $100',
  },
  {
    icon: DollarSign,
    title: 'Garantía de Devolución',
    description: 'Dentro de los 30 días de la compra',
  },
  {
    icon: WalletCards,
    title: 'Pago Flexible',
    description: 'Mercado Pago o transferencia bancaria',
  },
  {
    icon: Headset,
    title: 'Soporte 24/7',
    description: 'Recibí asistencia en cualquier momento',
  },
];

const IconBoxesDark = () => {
  return (
    <section className='bg-[#0d1117] border-y border-white/10'>
      <div className='wrapper py-16'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className='flex flex-col gap-3 group'>
                {/* Icon container */}
                <div className='w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300'>
                  <Icon className='h-5 w-5 text-white/60 group-hover:text-white transition-colors duration-300' />
                </div>
                <div>
                  <p className='text-white font-medium text-sm mb-1'>{feature.title}</p>
                  <p className='az-body-sm text-white/60 leading-relaxed'>{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default IconBoxesDark;
