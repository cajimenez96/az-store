import Header from '@/components/shared/header';
import FooterDark from '@/components/footer-dark';
import PromoBanner from '@/components/shared/promo-banner';

export default function CinematicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col bg-az-canvas text-az-ink'>
      <PromoBanner />
      <Header />
      <main className='flex-1'>{children}</main>
      <FooterDark />
    </div>
  );
}
