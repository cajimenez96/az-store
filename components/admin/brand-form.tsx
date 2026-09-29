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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-[#111111]">Nombre de la Marca</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Nike"
                    className="bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11"
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-[#111111]">Slug</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: nike"
                    className="bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full bg-[#111111] hover:bg-black text-white rounded-full font-medium shadow-sm transition-all px-6 py-3 h-auto"
        >
          {form.formState.isSubmitting ? 'Guardando...' : `${type === 'Create' ? 'Crear' : 'Actualizar'} Marca`}
        </Button>
      </form>
    </Form>
  );
}
