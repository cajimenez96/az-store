'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { insertSizeSchema } from '@/lib/validators';
import { createSize } from '@/lib/actions/size.actions';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SizeForm({ categoryId }: { categoryId: string }) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertSizeSchema>>({
    resolver: zodResolver(insertSizeSchema),
    defaultValues: {
      name: '',
      categoryId: categoryId,
    },
  });

  async function onSubmit(values: z.infer<typeof insertSizeSchema>) {
    const res = await createSize(values);
    if (!res.success) {
      toast({ variant: 'destructive', description: res.message });
    } else {
      toast({ description: res.message });
      form.reset({ name: '', categoryId: categoryId });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder="Ej: S, M, XL, 38, 40..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="button"
        >
          {form.formState.isSubmitting ? 'Agregando...' : 'Agregar Talle'}
        </Button>
      </form>
    </Form>
  );
}
