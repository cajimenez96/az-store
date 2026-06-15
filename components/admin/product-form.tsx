'use client';

import { useToast } from '@/hooks/use-toast';
import { productDefaultValues } from '@/lib/constants';
import { insertProductSchema, updateProductSchema } from '@/lib/validators';
import { Product } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm, useFieldArray, useFormContext } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import slugify from 'slugify';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { createProduct, updateProduct } from '@/lib/actions/product.actions';
import { getSizesByCategory } from '@/lib/actions/size.actions';
import { searchColors } from '@/lib/actions/color.actions';
import { ImageUploadField } from '@/components/admin/image-upload-field';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { Checkbox } from '../ui/checkbox';
import ProductCard from '../shared/product/product-card';
import { Category, Size, SubCategory, Brand } from '@prisma/client';
import { useEffect, useState } from 'react';
import { UploadButton } from '@/lib/uploadthing';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';

type CategoryWithSizes = Category & {
  sizes: Size[];
  subCategories: SubCategory[];
};

type ProductFormValues = z.infer<typeof insertProductSchema>;

const ProductForm = ({
  type,
  product,
  productId,
  categories = [],
  brands = [],
  userRole: _userRole,
  mpSurchargePercent,
}: {
  type: 'Create' | 'Update';
  product?: Product;
  productId?: string;
  categories?: CategoryWithSizes[];
  brands?: Brand[];
  userRole?: string;
  /** Fase 2: % de recargo sugerido para MercadoPago (default 10). */
  mpSurchargePercent?: number;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  // Helpers: producto cargado con colors/variants del server
  const productColors = (product as Product | undefined)?.colors ?? [];
  const productVariants = (product as Product | undefined)?.variants ?? [];

  const form = useForm<ProductFormValues>({
    resolver:
      type === 'Update'
        ? zodResolver(updateProductSchema)
        : zodResolver(insertProductSchema),
    defaultValues:
      product && type === 'Update'
        ? {
            ...product,
            // Fase 2: extraer priceCash y priceMercadoPago del array `prices`
            // poblado por `productIncludes`. Fallback a '0.00' si no existe.
            priceCash:
              product.prices?.find((p) => p.paymentMethod === 'CASH')?.value?.toString() ??
              '0.00',
            priceMercadoPago:
              product.prices?.find((p) => p.paymentMethod === 'MERCADOPAGO')?.value?.toString() ??
              '0.00',
            // Mapear colors: el form quiere { colorId, images }
            colors: productColors.map((pc) => ({
              colorId: pc.colorId,
              images: pc.images,
            })),
            // Mapear variants: el form quiere { sizeId, colorId, stock } con colorId = Color.id
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variants: productVariants.map((v: any) => ({
              sizeId: v.sizeId as string | null,
              colorId: (v.productColor?.colorId as string | null) ?? null,
              stock: v.stock as number,
            })) as any,
          }
        : productDefaultValues,
  });

  const colorFields = useFieldArray({
    control: form.control,
    name: 'colors',
  });

  const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    // Validación: si hasColorVariants = true, exigir al menos un color con al menos una imagen
    if (values.hasColorVariants) {
      if (!values.colors || values.colors.length === 0) {
        toast({
          variant: 'destructive',
          description: 'Agregá al menos un color con sus imágenes.',
        });
        return;
      }
      const emptyColor = values.colors.find(
        (c) => !c.colorId || c.images.length === 0
      );
      if (emptyColor) {
        toast({
          variant: 'destructive',
          description: 'Cada color debe estar seleccionado y tener al menos una imagen.',
        });
        return;
      }
      // Dedup defensivo: si por algún motivo quedaron dos filas con el mismo
      // colorId (form desincronizado), quedarnos con la primera.
      const seen = new Set<string>();
      const deduped = values.colors.filter((c) => {
        if (seen.has(c.colorId)) return false;
        seen.add(c.colorId);
        return true;
      });
      values.colors = deduped;
    }

    if (type === 'Create') {
      const res = await createProduct(values);
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/products');
      }
    } else {
      if (!productId) {
        router.push('/admin/products');
        return;
      }
      const res = await updateProduct({ ...values, id: productId });
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/products');
      }
    }
  };

  const images = form.watch('images') || [];
  const isFeatured = form.watch('isFeatured');
  const banner = form.watch('banner');
  const name = form.watch('name');
  // Fase 2: el preview del card usa `priceCash` (precio base) por default.
  const priceCash = form.watch('priceCash');
  const categoryId = form.watch('categoryId');
  const brandId = form.watch('brandId');
  const slug = form.watch('slug');
  const variants = form.watch('variants') || [];
  const colors = form.watch('colors') || [];
  const hasColorVariants = form.watch('hasColorVariants');

  const [availableSubCategories, setAvailableSubCategories] = useState<
    SubCategory[]
  >([]);
  const [currentSizes, setCurrentSizes] = useState<Size[]>([]);
  const [globalColors, setGlobalColors] = useState<
    { id: string; name: string; hex: string }[]
  >([]);

  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    setAvailableSubCategories(cat?.subCategories ?? []);
    form.setValue('subCategoryId', null as unknown as string);
  }, [categoryId, categories, form]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await searchColors('');
      if (!cancelled) setGlobalColors(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewProduct = {
    id: productId || 'preview-id',
    name: name || 'Nombre del producto',
    slug: slug || 'slug-del-producto',
    category: categories.find((c) => c.id === categoryId)?.name || 'Categoría',
    images: images.length > 0 ? images : ['/assets/images/placeholder.jpg'],
    brand: { name: brands?.find((b) => b.id === brandId)?.name || 'Marca' },
    description: form.watch('description') || 'Descripción corta',
    price: priceCash || '0.00',
    stock: variants.reduce((acc, curr) => acc + Number(curr.stock || 0), 0),
    rating: '0',
    numReviews: '0',
    isFeatured: isFeatured || false,
    banner: banner || null,
    createdAt: new Date(),
  };

  useEffect(() => {
    const loadSizes = async () => {
      if (!categoryId) {
        setCurrentSizes([]);
        return;
      }

      const res = await getSizesByCategory(categoryId);
      if (res.success && res.data) {
        setCurrentSizes(res.data);

        // Si el form no tiene variants todavía (modo Create, o nueva categoría
        // en modo Update), inicializamos uno por size con stock 0.
        // Si ya hay variants (modo Update, misma categoría), NO los pisamos:
        // los defaultValues ya tienen el stock correcto y la grilla los lee.
        const existingVariants = (form.getValues('variants') as Array<{
          sizeId: string | null;
          colorId: string | null;
          stock: number;
        }>) || [];
        const categoryHasChanged = product?.categoryId !== categoryId;

        if (existingVariants.length === 0 || categoryHasChanged) {
          const newVariants = res.data.map((size) => ({
            sizeId: size.id,
            colorId: null,
            stock: 0,
          }));
          form.setValue('variants', newVariants);
        }
      } else {
        setCurrentSizes([]);
      }
    };

    loadSizes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, type, product?.categoryId]);

  // Fase 2: sugerencia automática de priceMercadoPago a partir de priceCash
  // y el recargo global. Solo sugerimos si el MP actual está "vacío" o si
  // fue autocompletado previamente por nosotros (trackeado en
  // `mpWasSuggested`). Si el vendedor lo tocó manualmente, no lo pisamos.
  const [mpWasSuggested, setMpWasSuggested] = useState(false);
  useEffect(() => {
    const sub = form.watch((value, { name }) => {
      if (name !== 'priceCash' && name !== 'priceMercadoPago') return;
      const cash = Number(value.priceCash);
      const mp = value.priceMercadoPago;
      // Si el usuario tocó MP manualmente, marcamos como no-sugerido
      if (name === 'priceMercadoPago') {
        setMpWasSuggested(false);
        return;
      }
      if (!Number.isFinite(cash) || cash <= 0) return;
      // Solo autocompletar MP si el campo está vacío, o si antes lo
      // habíamos sugerido (sigue "siendo nuestro").
      if (mp === '' || mp === '0' || mp === '0.00' || mpWasSuggested) {
        const suggested = (cash * (1 + (mpSurchargePercent ?? 10) / 100)).toFixed(2);
        form.setValue('priceMercadoPago', suggested, { shouldDirty: true });
        setMpWasSuggested(true);
      }
    });
    return () => sub.unsubscribe();
  }, [form, mpSurchargePercent, mpWasSuggested]);

  return (
    <Form {...form}>
      <form
        method='POST'
        onSubmit={form.handleSubmit(onSubmit)}
        className='grid grid-cols-1 lg:grid-cols-3 gap-8'
      >
        <div className='lg:col-span-2 space-y-8'>
          {/* Información Básica */}
          <Card className='shadow-az-card border-az-hairline-soft'>
            <CardHeader>
              <CardTitle className='az-body-lg-bold'>
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex flex-col md:flex-row gap-5'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Ingresá el nombre del producto'
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (type === 'Create') {
                              form.setValue(
                                'slug',
                                slugify(e.target.value, {
                                  lower: true,
                                  strict: true,
                                })
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <div className='relative flex gap-2'>
                          <Input
                            placeholder='Ingresá el slug'
                            {...field}
                            disabled
                          />
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => {
                              form.setValue(
                                'slug',
                                slugify(form.getValues('name'), {
                                  lower: true,
                                  strict: true,
                                })
                              );
                            }}
                          >
                            Generar
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='flex flex-col md:flex-row gap-5'>
                <FormField
                  control={form.control}
                  name='categoryId'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <select
                          className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                          {...field}
                        >
                          <option value=''>Seleccione una categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {availableSubCategories.length > 0 && (
                  <FormField
                    control={form.control}
                    name='subCategoryId'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>Sub-categoría</FormLabel>
                        <FormControl>
                          <select
                            className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                            {...field}
                            value={field.value ?? ''}
                          >
                            <option value=''>Sin sub-categoría</option>
                            {availableSubCategories.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name='brandId'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <select
                          className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                          {...field}
                        >
                          <option value=''>Seleccione una marca</option>
                          {brands?.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='flex flex-col gap-5'>
                {/* Fase 2: dual pricing. priceCash es la base; priceMercadoPago
                    se sugiere como `priceCash * (1 + MP_SURCHARGE_PERCENT / 100)`,
                    pero siempre editable. */}
                <FormField
                  control={form.control}
                  name='priceCash'
                  render={({ field }) => (
                    <FormItem className='w-full md:w-1/2'>
                      <FormLabel>Precio efectivo / transferencia</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Ingresá el precio base'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='priceMercadoPago'
                  render={({ field }) => (
                    <FormItem className='w-full md:w-1/2'>
                      <FormLabel>
                        Precio MercadoPago
                        <span className='ml-2 az-caption text-az-stone'>
                          (sugerido: cash + recargo)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Ingresá el precio para MP'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Ingresá la descripción del producto'
                          className='resize-none h-24'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Variantes de color */}
          <Card className='shadow-az-card border-az-hairline-soft'>
            <CardHeader>
              <CardTitle className='az-body-lg-bold'>
                Variantes de Color
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                control={form.control}
                name='hasColorVariants'
                render={({ field }) => (
                  <FormItem className='flex items-center space-x-2 space-y-0'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => {
                          field.onChange(v);
                          if (!v) form.setValue('colors', []);
                        }}
                      />
                    </FormControl>
                    <FormLabel className='font-semibold text-base'>
                      Este producto tiene variantes de color
                    </FormLabel>
                  </FormItem>
                )}
              />

              {hasColorVariants && (
                <div className='space-y-4'>
                  <p className='az-caption text-az-stone'>
                    Definí los colores disponibles para este producto. Cada
                    color tiene sus propias imágenes y comparte talles con los
                    demás colores.
                  </p>

                  {colorFields.fields.map((field, index) => (
                    <ColorFieldRow
                      key={field.id}
                      index={index}
                      onRemove={() => colorFields.remove(index)}
                      globalColors={globalColors}
                    />
                  ))}

                  <Button
                    type='button'
                    variant='outline'
                    onClick={() =>
                      colorFields.append({ colorId: '', images: [] })
                    }
                  >
                    <Plus className='w-4 h-4 mr-2' />
                    Agregar color
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventario */}
          <Card className='shadow-az-card border-az-hairline-soft'>
            <CardHeader>
              <CardTitle className='az-body-lg-bold'>Inventario</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {!categoryId ? (
                <p className='az-body-sm text-az-stone'>
                  Seleccioná una categoría para cargar talles.
                </p>
              ) : currentSizes.length === 0 ? (
                <p className='az-body-sm text-az-stone'>
                  La categoría seleccionada no tiene talles asignados.
                </p>
              ) : hasColorVariants ? (
                <ColorSizeStockGrid
                  sizes={currentSizes}
                  colors={(() => {
                    // Dedup por colorId y descartar los que no matchean con un Color global
                    const seen = new Set<string>();
                    const out: { colorId: string; name: string; hex: string }[] = [];
                    for (const c of colors) {
                      if (seen.has(c.colorId)) continue;
                      const global = globalColors.find((g) => g.id === c.colorId);
                      if (!global) continue;
                      seen.add(c.colorId);
                      out.push({
                        colorId: c.colorId,
                        name: global.name,
                        hex: global.hex,
                      });
                    }
                    return out;
                  })()}
                />
              ) : (
                <SimpleSizeStockGrid sizes={currentSizes} />
              )}
            </CardContent>
          </Card>

          {/* Imágenes y destacado */}
          <Card className='shadow-az-card border-az-hairline-soft'>
            <CardHeader>
              <CardTitle className='az-body-lg-bold'>
                Imágenes y Destacado
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='upload-field'>
                <FormField
                  control={form.control}
                  name='images'
                  render={() => (
                    <FormItem className='w-full'>
                      <FormLabel>
                        Imágenes del producto (fallback / OG)
                      </FormLabel>
                      <p className='az-caption text-az-stone mb-2'>
                        Se usan como galería por defecto y para compartir en
                        redes. Si el producto tiene variantes de color, las
                        imágenes por color tienen prioridad.
                      </p>
                      <div className='p-4 border border-az-hairline-soft rounded-az-lg mt-2'>
                        <FormControl>
                          <ImageUploadField
                            images={images}
                            onChange={(urls) => form.setValue('images', urls)}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='upload-field pt-4 border-t border-az-hairline-soft'>
                <FormField
                  control={form.control}
                  name='isFeatured'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className='font-semibold text-base'>
                        ¿Es producto destacado?
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {isFeatured && (
                  <div className='mt-4 border border-az-hairline-soft p-4 rounded-az-lg'>
                    <p className='text-sm text-zinc-500 mb-4'>
                      Sube un banner ancho para la página principal.
                    </p>
                    {banner ? (
                      <div className='relative group'>
                        <Image
                          src={banner}
                          alt='Imagen del banner'
                          className='w-full object-cover object-center rounded-sm'
                          width={1920}
                          height={680}
                        />
                        <button
                          type='button'
                          className='absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                          onClick={() => form.setValue('banner', '')}
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <UploadButton
                        endpoint='imageUploader'
                        onClientUploadComplete={(res: { url: string }[]) => {
                          form.setValue('banner', res[0].url);
                        }}
                        onUploadError={(error: Error) => {
                          toast({
                            variant: 'destructive',
                            description: `ERROR! ${error.message}`,
                          });
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview & Actions */}
        <div className='space-y-6'>
          <div className='sticky top-24'>
            <Card className='shadow-az-card border-az-hairline-soft overflow-hidden bg-az-surface-soft'>
              <CardHeader className='bg-az-canvas border-b border-az-hairline-soft pb-4'>
                <CardTitle className='text-sm uppercase tracking-widest text-zinc-500 font-medium text-center'>
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6 flex justify-center bg-az-surface-soft'>
                <div className='w-full max-w-[300px] pointer-events-none'>
                  <ProductCard product={previewProduct} />
                </div>
              </CardContent>
            </Card>

            <Button
              type='submit'
              size='lg'
              disabled={form.formState.isSubmitting}
              variant='buyCta'
              className='w-full mt-6 shadow-az-card transition-shadow py-6 text-base font-semibold'
            >
              {form.formState.isSubmitting
                ? 'Enviando...'
                : `${type === 'Create' ? 'Crear Producto' : 'Guardar Cambios'}`}
            </Button>
            {type === 'Update' && (
              <Button
                type='button'
                variant='outlineOnLight'
                className='w-full mt-3'
                onClick={() => router.push('/admin/products')}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;

// ============================================================================
// Subcomponentes
// ============================================================================

function ColorCombobox({
  value,
  onChange,
  options,
  excludeColorIds = [],
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string; hex: string }[];
  excludeColorIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  const availableOptions = options.filter(
    (o) => !excludeColorIds.includes(o.id) || o.id === value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between bg-az-canvas'
        >
          {selected ? (
            <span className='flex items-center gap-2'>
              <span
                className='inline-block w-4 h-4 rounded-full border border-az-hairline'
                style={{ backgroundColor: selected.hex }}
                aria-hidden
              />
              {selected.name}
            </span>
          ) : (
            <span className='text-az-stone'>Seleccionar color...</span>
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-full p-0 max-h-[300px] overflow-y-auto z-[9999] bg-az-canvas border-az-hairline-soft'
        align='start'
      >
        <Command className='bg-transparent'>
          <CommandInput
            placeholder='Buscar color...'
            className='border-none outline-none ring-0'
          />
          <CommandList>
            <CommandEmpty>
              Sin resultados. Creá el color en /admin/colors.
            </CommandEmpty>
            <CommandGroup>
              {availableOptions.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.name}
                  onSelect={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className='cursor-pointer'
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 text-az-primary',
                      opt.id === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span
                    className='inline-block w-4 h-4 rounded-full border border-az-hairline mr-2'
                    style={{ backgroundColor: opt.hex }}
                    aria-hidden
                  />
                  {opt.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ColorFieldRow({
  index,
  onRemove,
  globalColors,
}: {
  index: number;
  onRemove: () => void;
  globalColors: { id: string; name: string; hex: string }[];
}) {
  const { setValue, watch, getValues } = useFormContext<ProductFormValues>();
  const colorId = (watch(`colors.${index}.colorId`) as string) ?? '';
  const images = (watch(`colors.${index}.images`) as string[]) ?? [];

  // Excluir los colorId de las otras filas para que no se pueda elegir un
  // color dos veces en el mismo producto.
  const allColors = (getValues('colors') as Array<{ colorId: string }>) ?? [];
  const excludeColorIds = allColors
    .map((c, i) => (i !== index ? c.colorId : null))
    .filter((id): id is string => !!id);

  return (
    <div className='border border-az-hairline-soft rounded-az-lg p-4 space-y-3 bg-az-surface-soft'>
      <div className='flex items-start gap-3'>
        <div className='flex-1 space-y-2'>
          <label className='az-caption-bold text-az-stone uppercase tracking-wider'>
            Color
          </label>
          <ColorCombobox
            value={colorId}
            onChange={(v) =>
              setValue(`colors.${index}.colorId`, v, { shouldDirty: true })
            }
            options={globalColors}
            excludeColorIds={excludeColorIds}
          />
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={onRemove}
          className='h-10 w-10 text-az-critical hover:bg-red-50 mt-6'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>

      <div>
        <label className='az-caption-bold text-az-stone uppercase tracking-wider'>
          Imágenes del color
        </label>
        <div className='mt-2'>
          <ImageUploadField
            images={images}
            onChange={(urls) =>
              setValue(`colors.${index}.images`, urls, { shouldDirty: true })
            }
          />
        </div>
      </div>
    </div>
  );
}

function ColorSizeStockGrid({
  sizes,
  colors,
}: {
  sizes: Size[];
  colors: { colorId: string; name: string; hex: string }[];
}) {
  const { setValue, watch } = useFormContext<ProductFormValues>();
  const variants = (watch('variants') as Array<{
    sizeId: string | null;
    colorId: string | null;
    stock: number;
  }>) || [];

  const setStock = (sizeId: string, colorId: string, stock: number) => {
    const idx = variants.findIndex(
      (v) => v.sizeId === sizeId && v.colorId === colorId
    );
    if (idx >= 0) {
      const next = [...variants];
      next[idx] = { ...next[idx], stock };
      setValue('variants', next, { shouldDirty: true });
    } else {
      setValue(
        'variants',
        [...variants, { sizeId, colorId, stock }],
        { shouldDirty: true }
      );
    }
  };

  const getStock = (sizeId: string, colorId: string): number => {
    const v = variants.find(
      (v) => v.sizeId === sizeId && v.colorId === colorId
    );
    return v?.stock ?? 0;
  };

  if (colors.length === 0) {
    return (
      <p className='az-body-sm text-az-stone'>
        Agregá al menos un color en la sección de arriba para cargar stock.
      </p>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm border-collapse'>
        <thead>
          <tr>
            <th className='text-left p-2 border-b border-az-hairline-soft'>
              Talle
            </th>
            {colors.map((c, i) => (
              <th
                key={`${c.colorId}-${i}`}
                className='text-center p-2 border-b border-az-hairline-soft'
              >
                <div className='flex items-center justify-center gap-2'>
                  <span
                    className='inline-block w-3 h-3 rounded-full border border-az-hairline'
                    style={{ backgroundColor: c.hex }}
                    aria-hidden
                  />
                  {c.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((s) => (
            <tr key={s.id} className='border-b border-az-hairline-soft'>
              <td className='p-2 font-medium'>{s.name}</td>
              {colors.map((c, i) => {
                const current = getStock(s.id, c.colorId);
                return (
                  <td key={`${c.colorId}-${i}`} className='p-2 text-center'>
                    <Input
                      type='number'
                      min={0}
                      placeholder='0'
                      className='w-20 mx-auto text-center'
                      value={current > 0 ? current : ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          // Campo vacío: persistimos stock = 0 (sin variante
                          // creada). El server action filtra los = 0.
                          setStock(s.id, c.colorId, 0);
                        } else {
                          setStock(s.id, c.colorId, Number(raw));
                        }
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleSizeStockGrid({ sizes }: { sizes: Size[] }) {
  const { setValue, watch } = useFormContext<ProductFormValues>();
  const variants = (watch('variants') as Array<{
    sizeId: string | null;
    colorId: string | null;
    stock: number;
  }>) || [];

  const setStock = (sizeId: string, stock: number) => {
    const idx = variants.findIndex(
      (v) => v.sizeId === sizeId && v.colorId === null
    );
    if (idx >= 0) {
      const next = [...variants];
      next[idx] = { ...next[idx], stock };
      setValue('variants', next, { shouldDirty: true });
    } else {
      setValue(
        'variants',
        [...variants, { sizeId, colorId: null, stock }],
        { shouldDirty: true }
      );
    }
  };

  const getStock = (sizeId: string): number => {
    const v = variants.find((v) => v.sizeId === sizeId && v.colorId === null);
    return v?.stock ?? 0;
  };

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {sizes.map((s) => {
        const current = getStock(s.id);
        return (
          <div key={s.id} className='space-y-2'>
            <label className='text-sm font-medium'>{s.name}</label>
            <Input
              type='number'
              min={0}
              placeholder='0'
              value={current > 0 ? current : ''}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setStock(s.id, 0);
                } else {
                  setStock(s.id, Number(raw));
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
