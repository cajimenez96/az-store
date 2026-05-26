import HeaderStorefront from '@/components/shared/header/header-dark';
import FooterDark from '@/components/footer-dark';

export default function CinematicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col bg-az-canvas text-az-ink'>
      <HeaderStorefront />
      <main className='flex-1'>{children}</main>
      <FooterDark />
    </div>
  );
}
