import Image from 'next/image';

const LoadingPage = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-az-canvas gap-8'>
      <Image
        src='/images/logo-nombre.png'
        width={350}
        height={250}
        alt='AZ Store'
        priority
        className='dark:invert'
      />
      <div className='relative h-5 w-5'>
        <div className='absolute inset-0 rounded-full border-2 border-az-hairline-soft' />
        <div className='absolute inset-0 rounded-full border-2 border-transparent border-t-az-primary animate-spin' />
      </div>
    </div>
  );
};

export default LoadingPage;
