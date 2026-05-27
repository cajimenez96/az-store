import Image from 'next/image';

const LoadingPage = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-az-canvas gap-8'>
      <Image
        src='/images/logo.svg'
        width={72}
        height={72}
        alt='AZ Store'
        priority
      />
      <div className='relative h-5 w-5'>
        <div className='absolute inset-0 rounded-full border-2 border-az-hairline-soft' />
        <div className='absolute inset-0 rounded-full border-2 border-transparent border-t-az-primary animate-spin' />
      </div>
    </div>
  );
};

export default LoadingPage;
