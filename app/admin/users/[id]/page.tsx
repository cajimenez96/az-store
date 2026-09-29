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
    <div className='max-w-xl mx-auto space-y-6'>
      <div>
        <h1 className='font-marder-display text-3xl font-black uppercase tracking-tight text-[#111111]'>Actualizar Usuario</h1>
        <p className='text-sm text-[#707072] mt-1'>Modifica los datos y permisos de este usuario.</p>
      </div>
      <div className='bg-white border border-[#e5e5e5] rounded-2xl p-6 md:p-8 shadow-sm'>
        <UpdateUserForm user={user} currentUserId={session?.user?.id} />
      </div>
    </div>
  );
};

export default AdminUserUpdatePage;
