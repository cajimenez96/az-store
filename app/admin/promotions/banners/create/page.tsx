import { Metadata } from 'next';
import PromoBannerForm from '@/components/admin/promo-banner-form';
import { requireAdmin } from '@/lib/auth-guard';
import { getAllCategories } from '@/lib/actions/category.actions';
import { getAllBrands } from '@/lib/actions/brand.actions';

export const metadata: Metadata = {
  title: 'Crear Banner',
};

export default async function CreateBannerPage() {
  await requireAdmin();

  const [categoriesResult, brands] = await Promise.all([
    getAllCategories(),
    getAllBrands(),
  ]);

  const categories = (categoriesResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  const brandsData = brands.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="h2-bold">Crear Banner Promocional</h1>
      <PromoBannerForm type="Create" categories={categories} brands={brandsData} />
    </div>
  );
}
