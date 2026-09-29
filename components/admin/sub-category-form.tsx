'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  createSubCategory,
  updateSubCategory,
} from '@/lib/actions/category.actions';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import slugify from 'slugify';

const subCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1, 'El slug es requerido'),
  categoryId: z.string().min(1, 'La categoría padre es requerida'),
});

type SubCategoryFormValues = z.infer<typeof subCategorySchema>;

interface SubCategoryFormProps {
  type: 'Create' | 'Update';
  subCategory?: { id: string; name: string; slug: string; categoryId: string };
  categories: { id: string; name: string }[];
  defaultCategoryId?: string;
}

export default function SubCategoryForm({
  type,
  subCategory,
  categories,
  defaultCategoryId,
}: SubCategoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SubCategoryFormValues>({
    resolver: zodResolver(subCategorySchema),
    defaultValues:
      subCategory && type === 'Update'
        ? subCategory
        : { name: '', slug: '', categoryId: defaultCategoryId ?? '' },
  });

  async function onSubmit(values: SubCategoryFormValues) {
    if (type === 'Create') {
      const res = await createSubCategory(values);
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/categories');
      }
    } else {
      if (!subCategory) return;
      const res = await updateSubCategory(subCategory.id, values);
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
        {/* Category parent selector */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-[#111111]">Categoría Padre</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white border-[#e5e5e5] rounded-xl text-[#111111] h-11">
                    <SelectValue placeholder="Seleccioná una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-[#e5e5e5] rounded-xl shadow-xl">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="cursor-pointer hover:bg-[#f5f5f5]">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    placeholder="Ej: Jeans"
                    className="bg-white border-[#e5e5e5] rounded-xl text-[#111111] placeholder:text-[#707072] focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] h-11"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
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
                    placeholder="Ej: jeans"
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
          {form.formState.isSubmitting
            ? 'Guardando...'
            : type === 'Create'
            ? 'Crear Sub-categoría'
            : 'Actualizar Sub-categoría'}
        </Button>
      </form>
    </Form>
  );
}
