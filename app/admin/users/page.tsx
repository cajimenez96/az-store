import { Metadata } from 'next';
import { getAllUsers, deleteUser } from '@/lib/actions/user.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Pagination from '@/components/shared/pagination';
import { Badge } from '@/components/ui/badge';
import DeleteDialog from '@/components/shared/delete-dialog';
import { requireAdmin } from '@/lib/auth-guard';
import { Pencil } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Usuarios (Admin)',
};

const AdminUserPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    role: string;
  }>;
}) => {
  await requireAdmin();

  const { page = '1', query: searchText, role = 'all' } = await props.searchParams;

  const users = await getAllUsers({ page: Number(page), query: searchText, role });

  return (
    <div className='space-y-8 max-w-7xl mx-auto'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]'>
        <div className='flex items-center gap-3'>
          <div>
            <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>
              Usuarios
            </h1>
            <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1'>
              Gestión de cuentas, roles y permisos de acceso
            </p>
          </div>
          {searchText && (
            <div className='flex items-center gap-2 bg-[#f5f5f5] px-3 py-1.5 rounded-full text-xs text-[#111111] font-medium'>
              <span>Filtro: <i>&quot;{searchText}&quot;</i></span>
              <Link href={`/admin/users?role=${role}`}>
                <Button variant='ghost' size='sm' className='h-5 px-1.5 text-[10px] uppercase font-semibold text-[#707072] hover:text-[#111111]'>
                  Quitar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild className={`rounded-full text-xs font-semibold uppercase tracking-wider h-9 px-5 ${role === 'all' ? 'bg-[#111111] text-white hover:bg-black' : 'border border-[#e5e5e5] bg-white text-[#111111] hover:bg-[#f5f5f5]'}`}>
          <Link href={`/admin/users?role=all${searchText ? `&query=${searchText}` : ''}`}>Todos</Link>
        </Button>
        <Button asChild className={`rounded-full text-xs font-semibold uppercase tracking-wider h-9 px-5 ${role === 'admin' ? 'bg-[#111111] text-white hover:bg-black' : 'border border-[#e5e5e5] bg-white text-[#111111] hover:bg-[#f5f5f5]'}`}>
          <Link href={`/admin/users?role=admin${searchText ? `&query=${searchText}` : ''}`}>Admins</Link>
        </Button>
        <Button asChild className={`rounded-full text-xs font-semibold uppercase tracking-wider h-9 px-5 ${role === 'seller' ? 'bg-[#111111] text-white hover:bg-black' : 'border border-[#e5e5e5] bg-white text-[#111111] hover:bg-[#f5f5f5]'}`}>
          <Link href={`/admin/users?role=seller${searchText ? `&query=${searchText}` : ''}`}>Vendedores</Link>
        </Button>
        <Button asChild className={`rounded-full text-xs font-semibold uppercase tracking-wider h-9 px-5 ${role === 'user' ? 'bg-[#111111] text-white hover:bg-black' : 'border border-[#e5e5e5] bg-white text-[#111111] hover:bg-[#f5f5f5]'}`}>
          <Link href={`/admin/users?role=user${searchText ? `&query=${searchText}` : ''}`}>Clientes</Link>
        </Button>
      </div>

      <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>ID</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>NOMBRE</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>EMAIL</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>ROL</TableHead>
              <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data.map((user) => (
              <TableRow key={user.id} className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'>
                <TableCell className='text-xs font-mono text-[#707072] py-4'>{formatId(user.id)}</TableCell>
                <TableCell className='font-semibold text-sm text-[#111111] py-4'>{user.name}</TableCell>
                <TableCell className='text-sm text-[#707072] py-4'>{user.email}</TableCell>
                <TableCell className='py-4'>
                  {user.role === 'user' ? (
                    <Badge variant='secondary' className='rounded-full text-[11px] font-semibold bg-[#f5f5f5] text-[#707072] border-0'>Cliente</Badge>
                  ) : user.role === 'seller' ? (
                    <Badge variant='outline' className="rounded-full text-[11px] font-semibold border-[#dcfce7] text-[#007d48] bg-[#f0fdf4]">Vendedor</Badge>
                  ) : (
                    <Badge variant='default' className='rounded-full text-[11px] font-semibold bg-[#111111] text-white hover:bg-black'>Administrador</Badge>
                  )}
                </TableCell>
                <TableCell className='py-4 text-right'>
                  <div className="flex gap-2 items-center justify-end">
                    <Button asChild variant='outline' size='sm' className="h-8 px-4 text-xs font-semibold uppercase tracking-wider rounded-full border border-[#e5e5e5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors">
                      <Link href={`/admin/users/${user.id}`}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Editar
                      </Link>
                    </Button>
                    <DeleteDialog id={user.id} action={deleteUser} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.totalPages > 1 && (
          <div className='border-t border-[#e5e5e5] pt-6 mt-4'>
            <Pagination page={Number(page) || 1} totalPages={users?.totalPages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserPage;
