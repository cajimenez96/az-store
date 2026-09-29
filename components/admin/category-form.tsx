'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { insertCategorySchema, updateCategorySchema } from '@/lib/validators';
import { createCategory, updateCategory } from '@/lib/actions/category.actions';
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
import { Category } from '@prisma/client';

export default function CategoryForm({
  type,
  category,
}: {
  type: 'Create' | 'Update';
  category?: Category;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertCategorySchema>>({
    resolver: zodResolver(
      type === 'Update' ? updateCategorySchema : insertCategorySchema
    ),
    defaultValues: category && type === 'Update' ? category : {
      name: '',
      slug: '',
    },
  });

  async function onSubmit(values: z.infer<typeof insertCategorySchema>) {
    if (type === 'Create') {
      const res = await createCategory(values);
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/categories');
      }
    } else {
      if (!category) return;
      const res = await updateCategory(category.id, values);
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/categories');
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-[#111111]">Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Remeras"
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
                    placeholder="Ej: remeras"
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
          {form.formState.isSubmitting ? 'Guardando...' : `${type} Categoría`}
        </Button>
      </form>
    </Form>
  );
}
