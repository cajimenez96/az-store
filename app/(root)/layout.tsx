import Header from '@/components/shared/header';
import Footer from '@/components/footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex h-screen flex-col'>
      <div className='print:hidden'>
        <Header />
      </div>
      <main className='flex-1 wrapper'>{children}</main>
      <div className='print:hidden'>
        <Footer />
      </div>
    </div>
  );
}
