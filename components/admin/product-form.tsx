'use client';

import { useToast } from '@/hooks/use-toast';
import { productDefaultValues } from '@/lib/constants';
import { insertProductSchema, updateProductSchema } from '@/lib/validators';
import { Product } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm, useFieldArray } from 'react-hook-form';
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
import { UploadButton } from '@/lib/uploadthing';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { Checkbox } from '../ui/checkbox';
import ProductCard from '../shared/product/product-card';
import { Category, Size, SubCategory, Brand } from '@prisma/client';
import { useEffect, useState } from 'react';

type CategoryWithSizes = Category & { sizes: Size[]; subCategories: SubCategory[] };

const ProductForm = ({
  type,
  product,
  productId,
  categories = [],
  brands = [],
  userRole,
}: {
  type: 'Create' | 'Update';
  product?: Product;
  productId?: string;
  categories?: CategoryWithSizes[];
  brands?: Brand[];
  userRole?: string;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertProductSchema>>({
    resolver:
      type === 'Update'
        ? zodResolver(updateProductSchema)
        : zodResolver(insertProductSchema),
    defaultValues:
      product && type === 'Update' ? {
        ...product,
        variants: (product as Product & { variants?: unknown[] }).variants || []
      } : productDefaultValues,
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const onSubmit: SubmitHandler<z.infer<typeof insertProductSchema>> = async (
    values
  ) => {
    // On Create
    if (type === 'Create') {
      const res = await createProduct(values);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
      } else {
        toast({
          description: res.message,
        });
        router.push('/admin/products');
      }
    }

    // On Update
    if (type === 'Update') {
      if (!productId) {
        router.push('/admin/products');
        return;
      }

      const res = await updateProduct({ ...values, id: productId });

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
      } else {
        toast({
          description: res.message,
        });
        router.push('/admin/products');
      }
    }
  };

  const images = form.watch('images') || [];
  const isFeatured = form.watch('isFeatured');
  const banner = form.watch('banner');
  const name = form.watch('name');
  const price = form.watch('price');
  const categoryId = form.watch('categoryId');
  const brandId = form.watch('brandId');
  const slug = form.watch('slug');

  // Available sub-categories for the selected category
  const [availableSubCategories, setAvailableSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    setAvailableSubCategories(cat?.subCategories ?? []);
    // Clear sub-category when parent changes
    form.setValue('subCategoryId', null as unknown as string);
  }, [categoryId, categories, form]);

  // Preview Object
  const previewProduct = {
    id: productId || 'preview-id',
    name: name || 'Nombre del producto',
    slug: slug || 'slug-del-producto',
    category: categories.find(c => c.id === categoryId)?.name || 'Categoría',
    images: images.length > 0 ? images : ['/assets/images/placeholder.jpg'],
    brand: { name: brands?.find(b => b.id === brandId)?.name || 'Marca' },
    description: form.watch('description') || 'Descripción corta',
    price: price || '0.00',
    stock: fields.reduce((acc, curr) => acc + Number(curr.stock || 0), 0),
    rating: '0',
    numReviews: '0',
    isFeatured: isFeatured || false,
    banner: banner || null,
    createdAt: new Date(),
  };

  // Reset variants when category changes
  useEffect(() => {
    if (categoryId) {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      if (selectedCategory && selectedCategory.sizes) {
        // Only override variants on Create, or if changing to a new category entirely on Update
        const currentCategoryId = product?.categoryId;
        if (type === 'Create' || currentCategoryId !== categoryId) {
          const newVariants = selectedCategory.sizes.map((size) => ({
            sizeId: size.id,
            stock: 0,
          }));
          replace(newVariants);
        }
      } else {
        replace([]);
      }
    }
  }, [categoryId, categories, replace, type, product]);

  return (
    <Form {...form}>
      <form
        method='POST'
        onSubmit={form.handleSubmit(onSubmit)}
        className='grid grid-cols-1 lg:grid-cols-3 gap-8'
      >
        {/* Left Column - Form Fields */}
        <div className='lg:col-span-2 space-y-8'>
          <Card className="shadow-az-card border-az-hairline-soft">
            <CardHeader>
              <CardTitle className="az-body-lg-bold">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className='flex flex-col md:flex-row gap-5'>
                {/* Name */}
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
                              form.setValue('slug', slugify(e.target.value, { lower: true, strict: true }));
                            }
                          }}
                          disabled={userRole === 'seller'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Slug */}
                <FormField
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <div className='relative flex gap-2'>
                          <Input placeholder='Ingresá el slug' {...field} disabled={userRole === 'seller'} />
                          <Button
                            type='button'
                            variant='outline'
                            disabled={userRole === 'seller'}
                            onClick={() => {
                              form.setValue(
                                'slug',
                                slugify(form.getValues('name'), { lower: true, strict: true })
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
                {/* Category */}
                <FormField
                  control={form.control}
                  name='categoryId'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          disabled={userRole === 'seller'}
                        >
                          <option value="">Seleccione una categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sub-Category (only when parent has sub-categories) */}
                {availableSubCategories.length > 0 && (
                  <FormField
                    control={form.control}
                    name='subCategoryId'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>Sub-categoría</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                            value={field.value ?? ''}
                            disabled={userRole === 'seller'}
                          >
                            <option value="">Sin sub-categoría</option>
                            {availableSubCategories.map((sub) => (
                              <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Brand */}
                <FormField
                  control={form.control}
                  name='brandId'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          disabled={userRole === 'seller'}
                        >
                          <option value="">Seleccione una marca</option>
                          {brands?.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='flex flex-col gap-5'>
                {/* Price */}
                <FormField
                  control={form.control}
                  name='price'
                  render={({ field }) => (
                    <FormItem className='w-full md:w-1/2'>
                      <FormLabel>Precio</FormLabel>
                      <FormControl>
                        <Input placeholder='Ingresá el precio del producto' {...field} disabled={userRole === 'seller'} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Variants (Stock per Size) */}
                {categoryId && (
                  <div className="border border-az-hairline-soft rounded-az-lg p-4 bg-az-surface-soft mt-4">
                    <FormLabel className="mb-4 block text-base">Inventario por Talles</FormLabel>
                    {fields.length === 0 ? (
                      <p className="text-sm text-muted-foreground">La categoría seleccionada no tiene talles asignados.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {fields.map((field, index) => {
                          // Find the name of the size
                          const selectedCat = categories.find(c => c.id === categoryId);
                          const sizeObj = selectedCat?.sizes.find(s => s.id === field.sizeId);
                          return (
                            <div key={field.id} className="space-y-2">
                              <label className="text-sm font-medium">{sizeObj?.name || 'Talle'}</label>
                              
                              <input 
                                type="hidden" 
                                {...form.register(`variants.${index}.sizeId`)} 
                              />
                              
                              <Input 
                                type="number" 
                                placeholder="Stock"
                                {...form.register(`variants.${index}.stock`)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                {/* Description */}
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

          <Card className="shadow-az-card border-az-hairline-soft">
            <CardHeader>
              <CardTitle className="az-body-lg-bold">Imágenes y Destacado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className='upload-field'>
                {/* Images */}
                <FormField
                  control={form.control}
                  name='images'
                  render={() => (
                    <FormItem className='w-full'>
                      <FormLabel>Imágenes del Producto</FormLabel>
                      <div className='p-4 border border-az-hairline-soft rounded-az-lg mt-2 space-y-4'>
                        <div className='flex flex-wrap gap-4'>
                          {images.map((image: string, idx: number) => (
                            <div key={image} className="relative w-24 h-24 group">
                              <Image
                                src={image}
                                alt='Imagen del producto'
                                className='object-cover object-center rounded-sm w-full h-full'
                                width={100}
                                height={100}
                              />
                              {userRole !== 'seller' && (
                                <button 
                                  type="button" 
                                  className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    const newImages = [...images];
                                    newImages.splice(idx, 1);
                                    form.setValue('images', newImages);
                                  }}
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          ))}
                          {userRole !== 'seller' && (
                            <FormControl>
                              <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-az-hairline rounded-az-sm hover:bg-az-surface-soft transition-colors">
                                <UploadButton
                                  endpoint='imageUploader'
                                  onClientUploadComplete={(res: { url: string }[]) => {
                                    form.setValue('images', [...images, res[0].url]);
                                  }}
                                  onUploadError={(error: Error) => {
                                    toast({
                                      variant: 'destructive',
                                      description: `ERROR! ${error.message}`,
                                    });
                                  }}
                                  appearance={{
                                    button: "bg-transparent text-black text-xs font-medium w-full h-full",
                                    allowedContent: "hidden"
                                  }}
                                  content={{ button: "+" }}
                                />
                              </div>
                            </FormControl>
                          )}
                        </div>
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
                          disabled={userRole === 'seller'}
                        />
                      </FormControl>
                      <FormLabel className="font-semibold text-base">¿Es producto destacado?</FormLabel>
                    </FormItem>
                  )}
                />
                
                {isFeatured && (
                  <div className="mt-4 border border-az-hairline-soft p-4 rounded-az-lg">
                    <p className="text-sm text-zinc-500 mb-4">Sube un banner ancho para la página principal.</p>
                    {banner ? (
                      <div className="relative group">
                        <Image
                          src={banner}
                          alt='Imagen del banner'
                          className='w-full object-cover object-center rounded-sm'
                          width={1920}
                          height={680}
                        />
                        {userRole !== 'seller' && (
                          <button 
                            type="button" 
                            className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => form.setValue('banner', '')}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ) : userRole !== 'seller' ? (
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
                    ) : null}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview & Actions */}
        <div className='space-y-6'>
          <div className="sticky top-24">
            <Card className="shadow-az-card border-az-hairline-soft overflow-hidden bg-az-surface-soft">
              <CardHeader className="bg-az-canvas border-b border-az-hairline-soft pb-4">
                <CardTitle className="text-sm uppercase tracking-widest text-zinc-500 font-medium text-center">Vista Previa</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex justify-center bg-az-surface-soft">
                <div className="w-full max-w-[300px] pointer-events-none">
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
              {form.formState.isSubmitting ? 'Enviando...' : `${type === 'Create' ? 'Crear Producto' : 'Guardar Cambios'}`}
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
