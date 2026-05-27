import { requireAdminOrSeller } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  await requireAdminOrSeller();
  redirect('/admin/overview');
}
