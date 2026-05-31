import { Metadata } from 'next';
import PromoBannerForm from '@/components/admin/promo-banner-form';
import { requireAdmin } from '@/lib/auth-guard';
import { getPromoBannerById } from '@/lib/actions/promo-banner.actions';
import { getAllCategories } from '@/lib/actions/category.actions';
import { getAllBrands } from '@/lib/actions/brand.actions';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Editar Banner',
};

export default async function EditBannerPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await props.params;

  const [banner, categoriesResult, brands] = await Promise.all([
    getPromoBannerById(id),
    getAllCategories(),
    getAllBrands(),
  ]);

  if (!banner) notFound();

  const categories = (categoriesResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  const brandsData = brands.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="h2-bold">Editar Banner Promocional</h1>
      <PromoBannerForm
        type="Update"
        banner={banner}
        categories={categories}
        brands={brandsData}
      />
    </div>
  );
}
