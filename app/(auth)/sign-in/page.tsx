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
import CredentialsSignInForm from './credentials-signin-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  robots: {
    index: false,
    follow: false,
  },
};

const SignInPage = async (props: {
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
        <CardHeader className='space-y-12'>
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
          <CardTitle className='az-heading-sm text-az-ink-deep text-center'>
            Iniciar Sesión
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <CredentialsSignInForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;
