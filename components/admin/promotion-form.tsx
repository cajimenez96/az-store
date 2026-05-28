'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { insertPromotionSchema, updatePromotionSchema } from '@/lib/validators';
import { createPromotion, updatePromotion } from '@/lib/actions/promotion.actions';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Promotion } from '@prisma/client';

export default function PromotionForm({
  type,
  promotion,
}: {
  type: 'Create' | 'Update';
  promotion?: Promotion;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertPromotionSchema>>({
    resolver: zodResolver(
      type === 'Update' ? updatePromotionSchema : insertPromotionSchema
    ),
    defaultValues: promotion && type === 'Update' ? {
      title: promotion.title,
      subtitle: promotion.subtitle || '',
      linkUrl: promotion.linkUrl || '',
      linkLabel: promotion.linkLabel || '',
      bgColor: promotion.bgColor || '#000000',
      textColor: promotion.textColor || '#ffffff',
      isActive: promotion.isActive,
      startsAt: promotion.startsAt ? promotion.startsAt.toISOString().slice(0, 16) : '',
      endsAt: promotion.endsAt ? promotion.endsAt.toISOString().slice(0, 16) : '',
    } : {
      title: '',
      subtitle: '',
      linkUrl: '',
      linkLabel: '',
      bgColor: '#000000',
      textColor: '#ffffff',
      isActive: true,
      startsAt: '',
      endsAt: '',
    },
  });

  async function onSubmit(values: z.infer<typeof insertPromotionSchema>) {
    if (type === 'Create') {
      const res = await createPromotion(values);
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/promotions');
      }
    } else {
      if (!promotion) return;
      const res = await updatePromotion({ ...values, id: promotion.id });
      if (!res.success) {
        toast({ variant: 'destructive', description: res.message });
      } else {
        toast({ description: res.message });
        router.push('/admin/promotions');
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la Promoción</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Descuento 50% en ropa"
                  {...field}
                />
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
                <Input
                  placeholder="Ej: Aplica a todas las categorías"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Link URL */}
        <FormField
          control={form.control}
          name="linkUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del enlace (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: https://tu-sitio.com/descuentos"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Link Label */}
        <FormField
          control={form.control}
          name="linkLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto del botón (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Ver oferta →"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Colors */}
        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="bgColor"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Color de fondo</FormLabel>
                <FormControl>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      {...field}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{field.value}</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="textColor"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Color de texto</FormLabel>
                <FormControl>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      {...field}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{field.value}</span>
                  </div>
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
                  <Input
                    type="datetime-local"
                    {...field}
                  />
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
                  <Input
                    type="datetime-local"
                    {...field}
                  />
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
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-semibold">Activar promoción</FormLabel>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="button col-span-2 w-full"
        >
          {form.formState.isSubmitting ? 'Guardando...' : `${type === 'Create' ? 'Crear' : 'Actualizar'} Promoción`}
        </Button>
      </form>
    </Form>
  );
}
