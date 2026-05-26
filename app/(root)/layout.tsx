import Header from '@/components/shared/header';
import Footer from '@/components/footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col bg-az-canvas'>
      <div className='print:hidden'>
        <Header />
      </div>
      <main className='flex-1 az-wrapper py-8'>{children}</main>
      <div className='print:hidden'>
        <Footer />
      </div>
    </div>
  );
}
