import { Metadata } from 'next';
import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';
import ProfileForm from './profile-form';
import { getUserById } from '@/lib/actions/user.actions';
import { ShippingAddress } from '@/types';

export const metadata: Metadata = {
  title: 'Perfil del Cliente',
};

const Profile = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await getUserById(session.user.id);
  const address = (user?.address as ShippingAddress) || undefined;

  return (
    <SessionProvider session={session}>
      <div className='max-w-2xl mx-auto space-y-6'>
        <h2 className='font-display font-[330] text-3xl md:text-4xl text-black dark:text-white font-ss03'>Perfil</h2>
        <ProfileForm address={address} />
      </div>
    </SessionProvider>
  );
};

export default Profile;
