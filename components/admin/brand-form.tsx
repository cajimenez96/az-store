'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { insertBrandSchema, updateBrandSchema } from '@/lib/validators';
import { createBrand, updateBrand } from '@/lib/actions/brand.actions';
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
import slugify from 'slugify';
import { Brand } from '@prisma/client';

export default function BrandForm({
  type,
  brand,
}: {
  type: 'Create' | 'Update';
  brand?: Brand;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertBrandSchema>>({
    resolver: zodResolver(
      type === 'Update' ? updateBrandSchema : insertBrandSchema
    ),
    defaultValues: brand && type === 'Update' ? brand : {
      name: '',
      slug: '',
    },
  });

  async function onSubmit(values: z.infer<typeof insertBrandSchema>) {
    if (type === 'Create') {
      const res = await createBrand(values);
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/brands');
      }
    } else {
      if (!brand) return;
      const res = await updateBrand({ ...values, id: brand.id });
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/brands');
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col gap-5 md:flex-row">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Nombre de la Marca</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Nike"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // Auto slugify
                      if (type === 'Create' || !form.formState.dirtyFields.slug) {
                        form.setValue(
                          'slug',
                          slugify(e.target.value, { lower: true, strict: true })
                        );
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
            name="slug"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: nike" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="button col-span-2 w-full"
        >
          {form.formState.isSubmitting ? 'Guardando...' : `${type === 'Create' ? 'Crear' : 'Actualizar'} Marca`}
        </Button>
      </form>
    </Form>
  );
}
