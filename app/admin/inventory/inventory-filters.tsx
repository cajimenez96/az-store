'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category, Brand } from '@prisma/client';
import { useEffect, useState } from 'react';

export default function InventoryFilters({
  categories,
  brands,
  currentCategory,
  currentBrand,
  currentStock,
  currentQuery
}: {
  categories: Category[];
  brands: Brand[];
  currentCategory: string;
  currentBrand: string;
  currentStock: string;
  currentQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(currentQuery);
  const [category, setCategory] = useState(currentCategory);
  const [brand, setBrand] = useState(currentBrand);
  const [stock, setStock] = useState(currentStock);

  useEffect(() => {
    setQuery(currentQuery);
    setCategory(currentCategory);
    setBrand(currentBrand);
    setStock(currentStock);
  }, [currentQuery, currentCategory, currentBrand, currentStock]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('query', query);
    else params.delete('query');

    if (category !== 'all') params.set('category', category);
    else params.delete('category');

    if (brand !== 'all') params.set('brand', brand);
    else params.delete('brand');

    if (stock !== 'all') params.set('stock', stock);
    else params.delete('stock');

    params.set('page', '1');
    router.push(`/admin/inventory?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/admin/inventory');
  };

  return (
    <div className="bg-az-surface-soft border border-az-hairline-soft rounded-az-xl p-4 mb-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="az-caption-bold uppercase text-az-stone mb-1 block">Búsqueda</label>
          <Input 
            placeholder="Buscar por nombre..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>
        <div>
          <label className="az-caption-bold uppercase text-az-stone mb-1 block">Marca</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="all">Todas las Marcas</option>
            {brands.map(b => (
              <option key={b.id} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="az-caption-bold uppercase text-az-stone mb-1 block">Categoría</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todas las Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="az-caption-bold uppercase text-az-stone mb-1 block">Estado de Stock</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="critical">Stock Crítico</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={clearFilters}>Limpiar Filtros</Button>
        <Button onClick={applyFilters}>Aplicar Filtros</Button>
      </div>
    </div>
  );
}
