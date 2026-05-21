import HeaderDark from '@/components/shared/header/header-dark';
import FooterDark from '@/components/footer-dark';

export default function CinematicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col bg-canvas-night text-white'>
      <HeaderDark />
      <main className='flex-1'>{children}</main>
      <FooterDark />
    </div>
  );
}
