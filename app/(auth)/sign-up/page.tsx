import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SignUpForm from './sign-up-form';

export const metadata: Metadata = {
  title: 'Registrarse',
  robots: {
    index: false,
    follow: false,
  },
};

const SignUpPage = async (props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) => {
  const { callbackUrl } = await props.searchParams;

  const session = await auth();

  if (session) {
    return redirect(callbackUrl || '/');
  }

  return (
    <div className='w-full max-w-md mx-auto px-4'>
      <Card className='border border-az-hairline-soft shadow-az-sticky bg-az-canvas'>
        <CardHeader className='space-y-4'>
          <Link href='/' className='flex-center'>
            <Image
              src='/images/logo-nombre.png'
              alt={`${APP_NAME} logo`}
              width={4000}
              height={1303}
              className='h-auto max-w-[310px] dark:invert'
              priority
            />
          </Link>
          {/* <CardTitle className='text-center az-heading-sm text-az-ink-deep'>
            Crear cuenta
          </CardTitle> */}
          <CardDescription className='text-center az-body-sm text-az-stone'>
            Ingresá tus datos para registrarte
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;
