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
    <div className='space-y-4'>
      <div className='flex items-center gap-3'>
        <h1 className='h2-bold'>Usuarios</h1>
        {searchText && (
          <div>
            Filtrado por <i>&quot;{searchText}&quot;</i>{' '}
            <Link href={`/admin/users?role=${role}`}>
              <Button variant='outline' size='sm'>
                Quitar Filtro
              </Button>
            </Link>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button asChild variant={role === 'all' ? 'default' : 'outline'} size="sm">
          <Link href={`/admin/users?role=all${searchText ? `&query=${searchText}` : ''}`}>Todos</Link>
        </Button>
        <Button asChild variant={role === 'admin' ? 'default' : 'outline'} size="sm">
          <Link href={`/admin/users?role=admin${searchText ? `&query=${searchText}` : ''}`}>Admins</Link>
        </Button>
        <Button asChild variant={role === 'seller' ? 'default' : 'outline'} size="sm">
          <Link href={`/admin/users?role=seller${searchText ? `&query=${searchText}` : ''}`}>Vendedores</Link>
        </Button>
        <Button asChild variant={role === 'user' ? 'default' : 'outline'} size="sm">
          <Link href={`/admin/users?role=user${searchText ? `&query=${searchText}` : ''}`}>Usuarios</Link>
        </Button>
      </div>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>NOMBRE</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>ROL</TableHead>
              <TableHead>ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{formatId(user.id)}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === 'user' ? (
                    <Badge variant='secondary'>Usuario</Badge>
                  ) : user.role === 'seller' ? (
                    <Badge variant='outline' className="border-emerald-500 text-emerald-700 bg-emerald-50">Vendedor</Badge>
                  ) : (
                    <Badge variant='default'>Administrador</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <Button asChild variant='default' size='sm' className="bg-zinc-900 hover:bg-zinc-800">
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
          <Pagination page={Number(page) || 1} totalPages={users?.totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminUserPage;
