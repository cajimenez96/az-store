'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { insertPromoBannerSchema, updatePromoBannerSchema } from '@/lib/validators';
import { createPromoBanner, updatePromoBanner } from '@/lib/actions/promo-banner.actions';
import { searchProductsForPicker } from '@/lib/actions/product.actions';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUploadField } from '@/components/shared/file-upload-field';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react';

type PickerProduct = {
  id: string;
  name: string;
  images: string[];
  price: string;
  category: { name: string };
  brand: { name: string };
};

type BannerProduct = {
  id: string;
  name: string;
  images: string[];
};

type PromoBannerWithProducts = {
  id: string;
  image: string;
  title: string;
  subtitle: string | null;
  linkLabel: string | null;
  discountPercent: number | null;
  order: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  products: BannerProduct[];
};

interface PromoBannerFormProps {
  type: 'Create' | 'Update';
  banner?: PromoBannerWithProducts;
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string }[];
}

export default function PromoBannerForm({
  type,
  banner,
  categories = [],
  brands = [],
}: PromoBannerFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Product picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerCategory, setPickerCategory] = useState('all');
  const [pickerBrand, setPickerBrand] = useState('all');
  const [searchResults, setSearchResults] = useState<PickerProduct[]>([]);
  const [isPending, startTransition] = useTransition();

  // Selected products state (mirrors productIds field)
  const [selectedProducts, setSelectedProducts] = useState<BannerProduct[]>(
    banner?.products ?? []
  );

  const form = useForm<z.infer<typeof insertPromoBannerSchema>>({
    resolver: zodResolver(
      type === 'Update' ? updatePromoBannerSchema : insertPromoBannerSchema
    ),
    defaultValues:
      banner && type === 'Update'
        ? {
            image: banner.image,
            title: banner.title,
            subtitle: banner.subtitle || '',
            linkLabel: banner.linkLabel || '',
            discountPercent: banner.discountPercent ?? undefined,
            productIds: banner.products.map((p) => p.id),
            order: banner.order,
            isActive: banner.isActive,
            startsAt: banner.startsAt ? banner.startsAt.toISOString().slice(0, 16) : '',
            endsAt: banner.endsAt ? banner.endsAt.toISOString().slice(0, 16) : '',
          }
        : {
            image: '',
            title: '',
            subtitle: '',
            linkLabel: '',
            discountPercent: undefined,
            productIds: [],
            order: 0,
            isActive: true,
            startsAt: '',
            endsAt: '',
          },
  });

  const productIds = form.watch('productIds');

  function handleSearch() {
    startTransition(async () => {
      const results = await searchProductsForPicker({
        query: pickerQuery || undefined,
        categorySlug: pickerCategory !== 'all' ? pickerCategory : undefined,
        brandId: pickerBrand !== 'all' ? pickerBrand : undefined,
      });
      setSearchResults(results as PickerProduct[]);
    });
  }

  function toggleProduct(product: PickerProduct) {
    const isSelected = productIds.includes(product.id);
    if (isSelected) {
      const next = productIds.filter((id) => id !== product.id);
      form.setValue('productIds', next);
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      form.setValue('productIds', [...productIds, product.id]);
      setSelectedProducts((prev) => [
        ...prev,
        {
          id: product.id,
          name: product.name,
          images: product.images,
        },
      ]);
    }
  }

  function removeProduct(id: string) {
    form.setValue('productIds', productIds.filter((pid) => pid !== id));
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function onSubmit(values: z.infer<typeof insertPromoBannerSchema>) {
    if (type === 'Create') {
      const res = await createPromoBanner(values);
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/promotions/banners');
      }
    } else {
      if (!banner) return;
      const res = await updatePromoBanner({ ...values, id: banner.id });
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/promotions/banners');
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Image */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen del banner</FormLabel>
              <FormControl>
                <FileUploadField
                  files={field.value ? [field.value] : []}
                  onChange={(urls) => field.onChange(urls[0] ?? '')}
                  endpoint="imageUploader"
                  multiple={false}
                  maxFiles={1}
                  placeholder="Arrastrá la imagen o hacé clic para seleccionar"
                  description="PNG, JPG, WEBP — 1 imagen"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Liquidación de invierno" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subtitle */}
        <FormField
          control={form.control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtítulo (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Hasta 50% off en toda la colección" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Link label + Discount */}
        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="linkLabel"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Texto del botón (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Ver oferta" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discountPercent"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Descuento % (opcional, solo para productos del banner)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Ej: 15"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dates */}
        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="startsAt"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Fecha de inicio (opcional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endsAt"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Fecha de fin (opcional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Active */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-semibold">Activar banner</FormLabel>
            </FormItem>
          )}
        />

        {/* Product picker */}
        <div className="border border-az-hairline-soft rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 bg-az-surface-soft hover:bg-az-hairline-soft transition-colors"
          >
            <span className="font-semibold text-az-ink-deep">
              Productos del banner ({selectedProducts.length} seleccionados)
            </span>
            {pickerOpen ? (
              <ChevronUp className="w-4 h-4 text-az-steel" />
            ) : (
              <ChevronDown className="w-4 h-4 text-az-steel" />
            )}
          </button>

          {pickerOpen && (
            <div className="p-5 space-y-5">
              {/* Selected products */}
              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-az-ink-deep">Seleccionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProducts.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 bg-az-primary/10 text-az-primary text-sm px-3 py-1 rounded-full"
                      >
                        {p.name}
                        <button
                          type="button"
                          onClick={() => removeProduct(p.id)}
                          className="hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Buscar por nombre..."
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                  className="flex-1"
                />
                <select
                  value={pickerCategory}
                  onChange={(e) => setPickerCategory(e.target.value)}
                  className="flex-1 h-9 rounded-az-md border border-az-hairline bg-background px-3 text-sm text-az-ink focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={pickerBrand}
                  onChange={(e) => setPickerBrand(e.target.value)}
                  className="flex-1 h-9 rounded-az-md border border-az-hairline bg-background px-3 text-sm text-az-ink focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="all">Todas las marcas</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={isPending}
                  className="gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  Buscar
                </Button>
              </div>

              {/* Results table */}
              {searchResults.length > 0 && (
                <div className="border border-az-hairline-soft rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-az-surface-soft sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left w-8"></th>
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-left hidden sm:table-cell">Categoría</th>
                        <th className="px-3 py-2 text-right">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((product) => {
                        const isSelected = productIds.includes(product.id);
                        return (
                          <tr
                            key={product.id}
                            className={`border-t border-az-hairline-soft cursor-pointer hover:bg-az-surface-soft/50 transition-colors ${
                              isSelected ? 'bg-az-primary/5' : ''
                            }`}
                            onClick={() => toggleProduct(product)}
                          >
                            <td className="px-3 py-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleProduct(product)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {product.images[0] && (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    width={32}
                                    height={32}
                                    className="rounded object-contain flex-shrink-0"
                                  />
                                )}
                                <span className="font-medium text-az-ink-deep line-clamp-1">
                                  {product.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-az-charcoal hidden sm:table-cell">
                              {product.category.name}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">
                              ${Number(product.price).toLocaleString('es-AR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {searchResults.length === 0 && !isPending && (
                <p className="text-sm text-az-steel text-center py-4">
                  Usá los filtros y hacé clic en &quot;Buscar&quot; para encontrar productos.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Hidden productIds field — managed programmatically */}
        <input type="hidden" {...form.register('productIds')} />

        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="button col-span-2 w-full"
        >
          {form.formState.isSubmitting
            ? 'Guardando...'
            : `${type === 'Create' ? 'Crear' : 'Actualizar'} Banner`}
        </Button>
      </form>
    </Form>
  );
}
