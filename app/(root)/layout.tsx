import Header from '@/components/shared/header';
import Footer from '@/components/footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col bg-white'>
      <div className='print:hidden'>
        <Header />
      </div>
      <main className='flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12'>{children}</main>
      <div className='print:hidden'>
        <Footer />
      </div>
    </div>
  );
}
