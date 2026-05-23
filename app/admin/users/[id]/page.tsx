import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import UpdateUserForm from './update-user-form';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Actualizar Usuario',
};

const AdminUserUpdatePage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const session = await requireAdmin();

  const { id } = await props.params;

  const user = await getUserById(id);

  if (!user) notFound();

  return (
    <div className='space-y-8 max-w-lg mx-auto'>
      <h1 className='h2-bold'>Actualizar Usuario</h1>
      <UpdateUserForm user={user} currentUserId={session?.user?.id} />
    </div>
  );
};

export default AdminUserUpdatePage;
