'use client';

import { useToast } from '@/hooks/use-toast';
import { productDefaultValues } from '@/lib/constants';
import { insertProductSchema, updateProductSchema } from '@/lib/validators';
import { Product } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';
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

const ProductForm = ({
  type,
  product,
  productId,
}: {
  type: 'Create' | 'Update';
  product?: Product;
  productId?: string;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertProductSchema>>({
    resolver:
      type === 'Update'
        ? zodResolver(updateProductSchema)
        : zodResolver(insertProductSchema),
    defaultValues:
      product && type === 'Update' ? product : productDefaultValues,
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

  const images = form.watch('images');
  const isFeatured = form.watch('isFeatured');
  const banner = form.watch('banner');
  const name = form.watch('name');
  const price = form.watch('price');
  const category = form.watch('category');
  const brand = form.watch('brand');
  const slug = form.watch('slug');
  const stock = form.watch('stock');

  // Preview Object
  const previewProduct = {
    id: productId || 'preview-id',
    name: name || 'Nombre del producto',
    slug: slug || 'slug-del-producto',
    category: category || 'Categoría',
    images: images.length > 0 ? images : ['/assets/images/placeholder.jpg'],
    brand: brand || 'Marca',
    description: form.watch('description') || 'Descripción corta',
    price: price || '0.00',
    stock: stock || 0,
    rating: '0',
    numReviews: '0',
    isFeatured: isFeatured || false,
    banner: banner || null,
    createdAt: new Date(),
  };

  return (
    <Form {...form}>
      <form
        method='POST'
        onSubmit={form.handleSubmit(onSubmit)}
        className='grid grid-cols-1 lg:grid-cols-3 gap-8'
      >
        {/* Left Column - Form Fields */}
        <div className='lg:col-span-2 space-y-8'>
          <Card className="shadow-level-2 border-hairline-light">
            <CardHeader>
              <CardTitle className="text-xl font-display font-[330]">Información Básica</CardTitle>
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
                          <Input placeholder='Ingresá el slug' {...field} />
                          <Button
                            type='button'
                            variant='outline'
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
                  name='category'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <Input placeholder='Ingresá la categoría' list='categories' {...field} />
                      </FormControl>
                      <datalist id="categories">
                        <option value="Accesorios" />
                        <option value="Indumentaria" />
                        <option value="Electrónica" />
                        <option value="Hogar" />
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Brand */}
                <FormField
                  control={form.control}
                  name='brand'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder='Ingresá la marca' list='brands' {...field} />
                      </FormControl>
                      <datalist id="brands">
                        <option value="AZ Brand" />
                        <option value="Genérica" />
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='flex flex-col md:flex-row gap-5'>
                {/* Price */}
                <FormField
                  control={form.control}
                  name='price'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Precio</FormLabel>
                      <FormControl>
                        <Input placeholder='Ingresá el precio del producto' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Stock */}
                <FormField
                  control={form.control}
                  name='stock'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder='Ingresá el stock' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

          <Card className="shadow-level-2 border-hairline-light">
            <CardHeader>
              <CardTitle className="text-xl font-display font-[330]">Imágenes y Destacado</CardTitle>
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
                      <div className='p-4 border border-hairline-light rounded-md mt-2 space-y-4'>
                        <div className='flex flex-wrap gap-4'>
                          {images.map((image: string, idx) => (
                            <div key={image} className="relative w-24 h-24 group">
                              <Image
                                src={image}
                                alt='Imagen del producto'
                                className='object-cover object-center rounded-sm w-full h-full'
                                width={100}
                                height={100}
                              />
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
                            </div>
                          ))}
                          <FormControl>
                            <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-zinc-300 rounded-sm hover:bg-zinc-50 transition-colors">
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
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='upload-field pt-4 border-t border-hairline-light'>
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
                      <FormLabel className="font-semibold text-base">¿Es producto destacado?</FormLabel>
                    </FormItem>
                  )}
                />
                
                {isFeatured && (
                  <div className="mt-4 border border-hairline-light p-4 rounded-md">
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
                        <button 
                          type="button" 
                          className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
          <div className="sticky top-24">
            <Card className="shadow-level-2 border-hairline-light overflow-hidden bg-zinc-50/50">
              <CardHeader className="bg-white border-b border-hairline-light pb-4">
                <CardTitle className="text-sm uppercase tracking-widest text-zinc-500 font-medium text-center">Vista Previa</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex justify-center bg-zinc-50">
                <div className="w-full max-w-[300px] pointer-events-none">
                  {/* @ts-expect-error - Ignoring TS for preview mock product */}
                  <ProductCard product={previewProduct} />
                </div>
              </CardContent>
            </Card>

            <Button
              type='submit'
              size='lg'
              disabled={form.formState.isSubmitting}
              variant='primaryPill'
              className='w-full mt-6 shadow-level-2 hover:shadow-level-3 transition-shadow py-6 text-base font-semibold'
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
