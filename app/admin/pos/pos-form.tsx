'use client';

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createPosOrder } from '@/lib/actions/order.actions';
import { searchPosCustomers, createPosCustomer } from '@/lib/actions/user.actions';
import { priceMethodFor } from '@/lib/pricing/price-method';
import { pickPrice } from '@/lib/pricing/price-lookup';
import {
  Search, Plus, Minus, Trash2, CheckCircle, Store, Receipt, CreditCard,
  Landmark, DollarSign, Loader2, UserPlus, UserCheck, X, ChevronDown, Filter
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PosVariant {
  id: string;
  stock: number;
  size: {
    name: string;
  } | null;
}

interface PosProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
  prices: { paymentMethod: string; value: string }[];
  brand: { name: string } | null;
  categoryId: string;
  variants: PosVariant[];
}

// Only what the UI needs; price is derived at render from the selected POS method.
interface PosCartItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  qty: number;
}

interface PosCategory {
  id: string;
  name: string;
}

interface PosFormProps {
  products: PosProduct[];
  categories: PosCategory[];
  sellerName: string;
}

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  dni: string | null;
  phone: string | null;
  address: any | null;
}

export default function PosForm({ products, categories, sellerName }: PosFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Product filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Cart state
  const [cart, setCart] = useState<PosCartItem[]>([]);

  // Customer search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerUser[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Selected customer state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);

  // Manual / Custom customer input (filled automatically if selectedCustomer is set)
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDni, setCustomerDni] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('PuntoDeVenta_Efectivo');

  // Customer creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    dni: '',
    streetAddress: '',
    city: 'Tucumán',
    province: 'Tucumán',
    postalCode: '4000',
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Success Modal state
  const [successOrder, setSuccessOrder] = useState<{ orderId: string; total: number } | null>(null);

  // Debounced search for customers
  useEffect(() => {
    if (!customerSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingCustomers(true);
      try {
        const res = await searchPosCustomers(customerSearchQuery);
        if (res.success && res.data) {
          // Cast users correctly
          setSearchResults(res.data as unknown as CustomerUser[]);
        }
      } catch (err) {
        console.error('Error searching customers:', err);
      } finally {
        setIsSearchingCustomers(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearchQuery]);

  // Sync selected customer fields
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.name);
      setCustomerEmail(selectedCustomer.email);
      setCustomerPhone(selectedCustomer.phone || '');
      setCustomerDni(selectedCustomer.dni || '');
      
      // Extract streetAddress from Json address
      const addressObj = selectedCustomer.address;
      if (addressObj && typeof addressObj === 'object') {
        setCustomerAddress(addressObj.streetAddress || '');
      } else {
        setCustomerAddress('');
      }
    } else {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerDni('');
      setCustomerAddress('');
    }
  }, [selectedCustomer]);

  // Filtered products list based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchesSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand?.name && p.brand.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // Totals calculations
  // Unit price per product for the SELECTED POS method (null = no price configured).
  // Display only: createPosOrder re-prices everything on the server.
  const unitPrices = useMemo(() => {
    const priceMethod = priceMethodFor('pos', paymentMethod);
    const map = new Map<string, string | null>();
    for (const p of products) {
      try {
        map.set(p.id, pickPrice(p.prices, priceMethod));
      } catch {
        map.set(p.id, null);
      }
    }
    return map;
  }, [products, paymentMethod]);

  const formatUnitPrice = (productId: string) => {
    const value = unitPrices.get(productId);
    return value == null ? 'Sin precio' : formatCurrency(value);
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (acc, item) => acc + Number(unitPrices.get(item.productId) ?? 0) * item.qty,
      0
    );
    const total = subtotal;
    return {
      subtotal,
      tax: 0,
      total,
    };
  }, [cart, unitPrices]);

  // Add item to local cart
  const handleAddToCart = (product: PosProduct, variant: PosVariant) => {
    if (!variant.size) return;
    const sizeName = variant.size.name;
    const existingIndex = cart.findIndex((item) => item.productId === product.id && item.size === sizeName);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].qty;
      if (currentQty >= variant.stock) {
        toast({
          variant: 'destructive',
          description: `No hay más stock disponible para ${product.name} (Talle ${sizeName}). Máximo: ${variant.stock}`,
        });
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
      setCart(updatedCart);
    } else {
      if (variant.stock < 1) {
        toast({
          variant: 'destructive',
          description: `El producto ${product.name} (Talle ${sizeName}) se encuentra sin stock.`,
        });
        return;
      }
      if (unitPrices.get(product.id) == null) {
        toast({
          variant: 'destructive',
          description: `${product.name} no tiene precio configurado para el método de pago elegido.`,
        });
        return;
      }
      const newItem: PosCartItem = {
        productId: product.id,
        name: product.name,
        qty: 1,
        image: product.images[0] || '/placeholder.png',
        size: sizeName,
      };
      setCart([...cart, newItem]);
    }

    toast({
      description: `Agregado: ${product.name} (Talle ${sizeName})`,
    });
  };

  // Adjust item quantity in cart
  const handleUpdateQty = (productId: string, size: string | undefined, delta: number) => {
    const index = cart.findIndex((item) => item.productId === productId && item.size === size);
    if (index === -1) return;

    const item = cart[index];
    const product = products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.size?.name === size);

    if (!variant) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      handleRemoveItem(productId, size);
      return;
    }

    if (newQty > variant.stock) {
      toast({
        variant: 'destructive',
        description: `Stock máximo alcanzado para ${item.name} (${size})`,
      });
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].qty = newQty;
    setCart(updatedCart);
  };

  // Remove item from cart
  const handleRemoveItem = (productId: string, size: string | undefined) => {
    setCart(cart.filter((item) => !(item.productId === productId && item.size === size)));
  };

  // Submit sale transaction
  const handleRegisterSale = () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        description: 'Debés agregar al menos un producto para registrar una venta.',
      });
      return;
    }

    if (cart.some((item) => unitPrices.get(item.productId) == null)) {
      toast({
        variant: 'destructive',
        description: 'Hay productos sin precio configurado para el método de pago elegido.',
      });
      return;
    }

    startTransition(async () => {
      const result = await createPosOrder({
        // The server prices, validates stock and computes the commission.
        items: cart.map((item) => ({
          productId: item.productId,
          size: item.size,
          qty: item.qty,
        })),
        paymentMethod,
        customerId: selectedCustomer?.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerDni: customerDni.trim(),
        customerAddress: customerAddress.trim(),
      });

      if (!result.success) {
        toast({
          variant: 'destructive',
          description: result.message || 'Error al procesar la venta.',
        });
        return;
      }

      setSuccessOrder({
        orderId: result.orderId || '',
        total: totals.total,
      });

      toast({
        description: 'Venta registrada con éxito.',
      });
    });
  };

  // Create a new customer via Modal Form
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.email.trim()) {
      toast({
        variant: 'destructive',
        description: 'El nombre y el correo electrónico son obligatorios.',
      });
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const res = await createPosCustomer(newCustomerForm);
      if (res.success && res.customer) {
        setSelectedCustomer(res.customer as unknown as CustomerUser);
        setIsCreateModalOpen(false);
        // Reset form
        setNewCustomerForm({
          name: '',
          email: '',
          phone: '',
          dni: '',
          streetAddress: '',
          city: 'Tucumán',
          province: 'Tucumán',
          postalCode: '4000',
        });
        toast({
          description: 'Cliente registrado y seleccionado para la venta.',
        });
      } else {
        toast({
          variant: 'destructive',
          description: res.message || 'No se pudo crear el cliente.',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        description: 'Error al registrar cliente.',
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Reset screen for next sale
  const handleResetSale = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setPaymentMethod('PuntoDeVenta_Efectivo');
    setSuccessOrder(null);
    setSearchQuery('');
    setSelectedCategoryId('all');
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
      {/* Product Catalog Column */}
      <div className='lg:col-span-7 space-y-6'>
        {/* Search Header and Category Filter */}
        <div className='bg-white border border-[#e5e5e5] rounded-2xl p-5 space-y-4 shadow-none'>
          <div className='flex gap-3 items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707072] h-4 w-4' />
              <input
                data-testid='pos-customer-search'
                type='text'
                placeholder='Buscar producto por nombre, marca o slug...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 h-11 text-xs font-medium text-[#111111] bg-[#f5f5f5] placeholder:text-[#707072] rounded-full border border-transparent focus:border-[#111111] focus:bg-white focus:outline-none transition-all'
                autoFocus
              />
            </div>
            {searchQuery && (
              <Button
                variant='ghost'
                onClick={() => setSearchQuery('')}
                className='text-xs h-11 px-4 hover:bg-[#f5f5f5] rounded-full font-semibold uppercase tracking-wider text-[#707072]'
              >
                Limpiar
              </Button>
            )}
          </div>

          {/* Categories Quick Filter */}
          <div className='flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none'>
            <span className='text-xs font-semibold text-[#707072] flex items-center gap-1 mr-1 flex-shrink-0 uppercase tracking-wider'>
              <Filter className='h-3 w-3' /> Categoría:
            </span>
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedCategoryId === 'all'
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#111111]'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex-shrink-0 ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#111111]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[62vh] overflow-y-auto pr-2'>
          {filteredProducts.length === 0 ? (
            <div className='col-span-2 py-12 text-center text-xs font-semibold text-[#707072] bg-[#f9f9f9] border border-dashed border-[#e5e5e5] rounded-2xl'>
              No se encontraron productos con los filtros seleccionados.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
              return (
                <div
                  key={product.id}
                  className='bg-white border border-[#e5e5e5] rounded-2xl p-4 flex flex-col justify-between hover:border-[#111111] transition-all duration-200 group shadow-none'
                >
                  <div className='flex gap-4'>
                    <div className='relative h-20 w-20 rounded-xl overflow-hidden bg-[#f5f5f5] border border-[#e5e5e5] flex-shrink-0'>
                      <Image
                        src={product.images[0] || '/placeholder.png'}
                        alt={product.name}
                        fill
                        className='object-contain group-hover:scale-105 transition-transform duration-300'
                        sizes='80px'
                      />
                    </div>
                    <div className='space-y-1 min-w-0'>
                      <span className='text-[10px] font-semibold text-[#707072] uppercase tracking-wider block'>
                        {product.brand?.name || 'Genérica'}
                      </span>
                      <h3 className='text-sm font-semibold text-[#111111] truncate' title={product.name}>
                        {product.name}
                      </h3>
                      <p className='text-sm font-semibold text-[#111111] tabular-nums'>
                        {formatUnitPrice(product.id)}
                      </p>
                      <p className='text-xs text-[#707072]'>
                        Stock: <span className={totalStock > 2 ? 'text-[#007d48] font-semibold' : 'text-[#d97706] font-semibold'}>{totalStock} u.</span>
                      </p>
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div className='mt-4 pt-3 border-t border-[#e5e5e5] space-y-1.5'>
                    <span className='text-[10px] font-semibold text-[#707072] uppercase tracking-wider block'>
                      Talle → Agregar:
                    </span>
                    <div className='flex flex-wrap gap-1.5'>
                      {product.variants.map((v) => {
                        if (!v.size) return null;
                        const inCartQty = cart.find((item) => item.productId === product.id && item.size === v.size!.name)?.qty || 0;
                        const remainingStock = v.stock - inCartQty;
                        const isOutOfStock = remainingStock <= 0;

                        return (
                          <button
                            key={v.id}
                            type='button'
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(product, v)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-150 ${
                              isOutOfStock
                                ? 'bg-[#f5f5f5] text-[#707072] border border-[#e5e5e5] line-through cursor-not-allowed'
                                : 'bg-[#f5f5f5] hover:bg-[#111111] hover:text-white text-[#111111] border border-[#e5e5e5]'
                            }`}
                          >
                            <span>{v.size!.name}</span>
                            <span className='opacity-60 font-normal'>({remainingStock})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* POS Cart Summary Column */}
      <div className='lg:col-span-5 space-y-6'>
        <div className='bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-6 shadow-none'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-[#e5e5e5] pb-4'>
            <div className='flex items-center gap-2'>
              <Store className='h-5 w-5 text-[#111111]' />
              <div>
                <h2 className='text-lg font-medium tracking-tight text-[#111111] font-marder-display'>Venta Actual</h2>
                <p className='text-xs text-[#707072]'>Vendedor: {sellerName}</p>
              </div>
            </div>
            {cart.length > 0 && (
              <Button
                variant='ghost'
                onClick={() => setCart([])}
                className='text-xs font-semibold uppercase tracking-wider text-[#d30005] hover:text-[#d30005] hover:bg-red-50 px-3 h-8 rounded-full'
              >
                Vaciar
              </Button>
            )}
          </div>

          {/* Cart List */}
          <div className='max-h-[22vh] overflow-y-auto space-y-3 pr-1'>
            {cart.length === 0 ? (
              <div className='py-6 text-center text-xs font-semibold text-[#707072]'>
                El carrito está vacío. Agregá talles de productos a la izquierda.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className='flex items-center justify-between gap-3 p-3.5 bg-[#f9f9f9] border border-[#e5e5e5] rounded-xl hover:bg-[#f5f5f5] transition-all duration-150'
                >
                  <div className='min-w-0 flex-1 space-y-0.5'>
                    <h4 className='text-sm font-semibold text-[#111111] truncate'>{item.name}</h4>
                    <p className='text-xs text-[#707072]'>
                      Talle: <span className='font-semibold text-[#111111]'>{item.size}</span> · {formatUnitPrice(item.productId)} c/u
                    </p>
                  </div>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex items-center border border-[#e5e5e5] rounded-full bg-white overflow-hidden h-7'>
                      <button
                        type='button'
                        data-testid="pos-item-dec"
                        onClick={() => handleUpdateQty(item.productId, item.size, -1)}
                        className='px-2 hover:bg-[#f5f5f5] text-[#111111] h-full flex items-center justify-center border-r border-[#e5e5e5]'
                      >
                        <Minus className='h-3 w-3' />
                      </button>
                      <span className='px-3 text-xs font-semibold text-[#111111] min-w-[24px] text-center tabular-nums'>
                        {item.qty}
                      </span>
                      <button
                        type='button'
                        onClick={() => handleUpdateQty(item.productId, item.size, 1)}
                        className='px-2 hover:bg-[#f5f5f5] text-[#111111] h-full flex items-center justify-center border-l border-[#e5e5e5]'
                      >
                        <Plus className='h-3 w-3' />
                      </button>
                    </div>
                    <button
                      type='button'
                      onClick={() => handleRemoveItem(item.productId, item.size)}
                      className='text-[#707072] hover:text-[#d30005] p-1 transition-colors'
                      title='Eliminar item'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Selection & Search */}
          <div className='pt-4 border-t border-[#e5e5e5] space-y-3.5'>
            <div className='flex justify-between items-center'>
              <h3 className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>
                Cliente de la Venta
              </h3>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsCreateModalOpen(true)}
                className='text-xs font-semibold uppercase tracking-wider text-[#111111] hover:bg-[#f5f5f5] h-8 px-3 rounded-full flex items-center gap-1.5'
              >
                <UserPlus className='h-3.5 w-3.5' />
                Nuevo Cliente
              </Button>
            </div>

            {/* Customer Search Autocomplete */}
            {!selectedCustomer ? (
              <div className='relative'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-[#707072] h-3.5 w-3.5' />
                  <Input
                    data-testid="pos-customer-search"
                    type="text"
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    className='pl-9 h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                    placeholder='Buscar por nombre, DNI o email...'
                  />
                </div>

                {/* Dropdown search results */}
                {showSearchResults && customerSearchQuery.trim() !== '' && (
                  <div className='absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#e5e5e5] rounded-2xl shadow-xl max-h-56 overflow-y-auto p-2 space-y-1'>
                    {isSearchingCustomers ? (
                      <div className='py-4 text-center text-xs text-[#707072] flex items-center justify-center gap-2'>
                        <Loader2 className='h-3.5 w-3.5 animate-spin text-[#111111]' />
                        Buscando en la base de datos...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className='py-4 text-center text-xs text-[#707072]'>
                        No se encontraron clientes. ¿Deseas registrar uno nuevo?
                      </div>
                    ) : (
                      searchResults.map((cust) => (
                        <button
                          key={cust.id}
                          type='button'
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setShowSearchResults(false);
                            setCustomerSearchQuery('');
                          }}
                          className='w-full text-left p-2.5 hover:bg-[#f5f5f5] rounded-xl flex flex-col gap-0.5 transition-colors'
                        >
                          <span className='text-xs font-semibold text-[#111111]'>{cust.name}</span>
                          <span className='text-[11px] text-[#707072]'>
                            {cust.dni ? `DNI: ${cust.dni}` : 'Sin DNI'} | {cust.email} {cust.phone ? `| Tel: ${cust.phone}` : ''}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className='bg-[#f5f5f5] border border-[#e5e5e5] rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in duration-200'>
                <div className='flex items-center gap-2 min-w-0'>
                  <div className='bg-white h-8 w-8 rounded-full flex items-center justify-center border border-[#e5e5e5] text-[#111111] flex-shrink-0'>
                    <UserCheck className='h-4 w-4' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold text-[#111111] truncate'>{selectedCustomer.name}</p>
                    <p className='text-[11px] text-[#707072] truncate'>
                      {selectedCustomer.dni ? `DNI: ${selectedCustomer.dni}` : 'Sin DNI'} | {selectedCustomer.email}
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => setSelectedCustomer(null)}
                  className='text-[#707072] hover:text-[#d30005] p-1 transition-colors'
                  title='Remover cliente'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            )}

            {/* Editable Fields */}
            <div className='grid grid-cols-2 gap-3 pt-1'>
              <div className='space-y-1'>
                <Label htmlFor='posCustName' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Nombre Completo</Label>
                <Input
                  data-testid='pos-customer-search'
                  id='posCustName'
                  placeholder='Consumidor Final'
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={!!selectedCustomer}
                  className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='posCustEmail' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Correo Electrónico</Label>
                <Input
                  data-testid='pos-customer-search'
                  id='posCustEmail'
                  type='email'
                  placeholder='consumidorfinal@local...'
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  disabled={!!selectedCustomer}
                  className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='posCustDni' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Documento (DNI)</Label>
                <Input
                  data-testid='pos-customer-search'
                  id='posCustDni'
                  placeholder='DNI del cliente'
                  value={customerDni}
                  onChange={(e) => setCustomerDni(e.target.value)}
                  disabled={!!selectedCustomer && !!selectedCustomer.dni}
                  className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='posCustPhone' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Teléfono de Contacto</Label>
                <Input
                  data-testid='pos-customer-search'
                  id='posCustPhone'
                  placeholder='Teléfono'
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={!!selectedCustomer && !!selectedCustomer.phone}
                  className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                />
              </div>
              <div className='col-span-2 space-y-1'>
                <Label htmlFor='posCustAddress' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Domicilio (Dirección)</Label>
                <Input
                  data-testid='pos-customer-search'
                  id='posCustAddress'
                  placeholder='Calle y número (ej. Comb. de las Piedras 1026)'
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  disabled={!!selectedCustomer && !!(selectedCustomer.address && selectedCustomer.address.streetAddress)}
                  className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                />
              </div>
            </div>
          </div>

          {/* Local Payment Methods */}
          <div className='pt-4 border-t border-[#e5e5e5] space-y-3'>
            <h3 className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>
              Método de Pago Local
            </h3>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className='grid grid-cols-2 gap-2.5'
            >
              {[
                { id: 'PuntoDeVenta_Efectivo', label: 'Efectivo', icon: DollarSign },
                { id: 'PuntoDeVenta_Transferencia', label: 'Transferencia', icon: Landmark },
                { id: 'PuntoDeVenta_QR', label: 'Código QR', icon: Receipt },
                { id: 'PuntoDeVenta_MercadoPago', label: 'M. Pago (Pos)', icon: CreditCard },
              ].map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.id;
                return (
                  <Label
                    key={method.id}
                    className={`flex items-center gap-2.5 border rounded-2xl p-3 cursor-pointer transition-all duration-150 ${
                      active
                        ? 'border-[#111111] bg-[#f5f5f5] text-[#111111] font-semibold'
                        : 'border-[#e5e5e5] text-[#707072] hover:bg-[#fafafa]'
                    }`}
                  >
                    <RadioGroupItem value={method.id} className='sr-only' />
                    <Icon className={`h-4 w-4 ${active ? 'text-[#111111]' : 'text-[#707072]'}`} />
                    <span className='text-xs font-semibold uppercase tracking-wider'>{method.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Price Totals & Submit */}
          <div className='pt-4 border-t border-[#e5e5e5] space-y-4'>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm text-[#707072]'>
                <span>Subtotal</span>
                <span className='tabular-nums text-[#111111] font-medium'>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className='flex justify-between border-t border-[#e5e5e5] pt-3 items-baseline'>
                <span className='text-sm font-semibold uppercase tracking-wider text-[#111111]'>Total a Cobrar</span>
                <span className='text-2xl font-medium tracking-tight text-[#111111] font-marder-display tabular-nums'>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <Button
              id='pos-register-sale'
              type='button'
              disabled={isPending || cart.length === 0}
              onClick={handleRegisterSale}
              className='w-full h-12 rounded-full bg-[#111111] text-white hover:bg-black font-semibold text-xs uppercase tracking-wider transition-colors'
            >
              {isPending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Registrando Venta...
                </>
              ) : (
                <>Registrar Venta ({formatCurrency(totals.total)})</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {successOrder && (
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#e5e5e5] space-y-6 text-center animate-in zoom-in-95 duration-200'>
            <div className='mx-auto h-16 w-16 bg-[#f5f5f5] rounded-full flex items-center justify-center text-[#007d48]'>
              <CheckCircle className='h-8 w-8' />
            </div>
            <div className='space-y-1'>
              <h3 className='text-2xl font-medium tracking-tight text-[#111111] font-marder-display'>¡Venta Registrada!</h3>
              <p className='text-xs text-[#707072]'>La transacción fue guardada y el stock fue actualizado.</p>
            </div>
            <div className='p-4 bg-[#f9f9f9] rounded-2xl text-left space-y-2 border border-[#e5e5e5]'>
              <div className='flex justify-between text-xs'>
                <span className='text-[#707072]'>ID de la Venta:</span>
                <span className='font-mono font-semibold text-[#111111]'>{successOrder.orderId.substring(0, 8)}...</span>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='text-[#707072]'>Cliente:</span>
                <span className='font-semibold text-[#111111] truncate max-w-[200px] block text-right'>{customerName || 'Consumidor Final'}</span>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='text-[#707072]'>Total Cobrado:</span>
                <span className='font-semibold text-[#111111] tabular-nums'>{formatCurrency(successOrder.total)}</span>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='text-[#707072]'>Método de Pago:</span>
                <span className='font-semibold text-[#111111]'>
                  {paymentMethod.replace('PuntoDeVenta_', 'POS ')}
                </span>
              </div>
            </div>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  window.open(`/order/${successOrder.orderId}`, '_blank');
                }}
                className='flex-1 h-11 rounded-full border border-[#e5e5e5] text-xs font-semibold uppercase tracking-wider text-[#111111] hover:bg-[#f5f5f5]'
              >
                <Receipt className='h-4 w-4 mr-1.5' />
                Ver Comprobante
              </Button>
              <Button
                onClick={handleResetSale}
                className='flex-1 h-11 rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider'
              >
                Nueva Venta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOMER MODAL */}
      {isCreateModalOpen && (
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-[#e5e5e5] space-y-5 animate-in zoom-in-95 duration-200'>
            <div className='flex justify-between items-center border-b border-[#e5e5e5] pb-3'>
              <h3 className='text-xl font-medium tracking-tight text-[#111111] font-marder-display'>Registrar Nuevo Cliente</h3>
              <button
                type='button'
                onClick={() => setIsCreateModalOpen(false)}
                className='text-[#707072] hover:text-[#111111] p-1 transition-colors'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className='space-y-4'>
              <div className='grid grid-cols-2 gap-3.5'>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalName' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Nombre Completo *</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalName'
                    required
                    placeholder='Ej: Carlos Jimenez'
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalEmail' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Email *</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalEmail'
                    type='email'
                    required
                    placeholder='ejemplo@correo.com'
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalDni' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Documento (DNI)</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalDni'
                    placeholder='Ej: 38444555'
                    value={newCustomerForm.dni}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, dni: e.target.value })}
                    className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalPhone' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Teléfono de Contacto</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalPhone'
                    placeholder='Ej: 3814445555'
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                  />
                </div>
                <div className='col-span-2 space-y-1.5'>
                  <Label htmlFor='modalStreet' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Domicilio (Calle y Altura)</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalStreet'
                    placeholder='Ej: Comb. de las Piedras 1026'
                    value={newCustomerForm.streetAddress}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, streetAddress: e.target.value })}
                    className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalCity' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Ciudad</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalCity'
                    placeholder='Tucumán'
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                    className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalProvince' className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>Provincia</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalProvince'
                    placeholder='Tucumán'
                    value={newCustomerForm.province}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, province: e.target.value })}
                    className='h-9 text-xs bg-[#f5f5f5] border-transparent focus-visible:ring-2 focus-visible:ring-[#111111] rounded-full focus:bg-white'
                  />
                </div>
              </div>

              <div className='flex justify-end gap-3 pt-4 border-t border-[#e5e5e5]'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => setIsCreateModalOpen(false)}
                  className='h-10 px-5 rounded-full text-xs font-semibold uppercase tracking-wider text-[#707072] hover:bg-[#f5f5f5]'
                >
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={isCreatingCustomer}
                  className='h-10 px-6 rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5'
                >
                  {isCreatingCustomer ? (
                    <>
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      Guardando...
                    </>
                  ) : (
                    'Guardar y Seleccionar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
