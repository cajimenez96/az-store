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
import { SIZE_NAME_MAX_LENGTH } from '@/lib/constants';

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full sm:flex-1">
              <FormControl>
                <Input
                  placeholder="Ej: S, M, XL, 38, 40..."
                  maxLength={SIZE_NAME_MAX_LENGTH}
                  className="h-11 rounded-nike-md border border-nike-hairline bg-white px-4 text-nike-ink shadow-none placeholder:text-nike-mute focus-visible:border-nike-ink focus-visible:ring-1 focus-visible:ring-nike-ink focus-visible:ring-offset-0"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-11 w-full shrink-0 rounded-nike-full bg-nike-ink px-6 font-medium text-white shadow-none transition-colors hover:bg-nike-charcoal sm:w-auto"
        >
          {form.formState.isSubmitting ? 'Agregando...' : 'Agregar Talle'}
        </Button>
      </form>
    </Form>
  );
}
