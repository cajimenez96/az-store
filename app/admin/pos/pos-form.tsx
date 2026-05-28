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
import { CartItem } from '@/types';
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
  };
}

interface PosProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: string;
  brand: { name: string } | null;
  categoryId: string;
  variants: PosVariant[];
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
  const [cart, setCart] = useState<CartItem[]>([]);

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
  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + Number(item.price) * item.qty, 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;
    return {
      subtotal,
      tax,
      total,
    };
  }, [cart]);

  // Add item to local cart
  const handleAddToCart = (product: PosProduct, variant: PosVariant) => {
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
      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
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
    const variant = product?.variants.find((v) => v.size.name === size);

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

    startTransition(async () => {
      const result = await createPosOrder({
        items: cart,
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
        <div className='bg-az-canvas border border-az-hairline-soft rounded-az-xl p-5 space-y-4'>
          <div className='flex gap-3 items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-az-stone h-4 w-4' />
              <Input
                    data-testid='pos-customer-search'
                type='text'
                placeholder='Buscar producto por nombre, marca o slug...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 h-11 border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                autoFocus
              />
            </div>
            {searchQuery && (
              <Button
                variant='ghost'
                onClick={() => setSearchQuery('')}
                className='text-xs h-11 px-4 hover:bg-az-surface-soft rounded-az-lg az-caption-bold text-az-steel'
              >
                Limpiar
              </Button>
            )}
          </div>

          {/* Categories Quick Filter */}
          <div className='flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none'>
            <span className='az-caption-bold text-az-stone flex items-center gap-1 mr-1 flex-shrink-0 uppercase tracking-wider'>
              <Filter className='h-3 w-3' /> Categoría:
            </span>
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1.5 rounded-az-full az-caption-bold transition-all ${
                selectedCategoryId === 'all'
                  ? 'bg-az-ink-deep text-white'
                  : 'bg-az-surface-soft hover:bg-az-hairline-soft text-az-charcoal'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-az-full az-caption-bold transition-all flex-shrink-0 ${
                  selectedCategoryId === cat.id
                    ? 'bg-az-ink-deep text-white'
                    : 'bg-az-surface-soft hover:bg-az-hairline-soft text-az-charcoal'
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
            <div className='col-span-2 py-12 text-center az-body-sm text-az-stone bg-az-surface-soft border border-dashed border-az-hairline rounded-az-xl'>
              No se encontraron productos con los filtros seleccionados.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
              return (
                <div
                  key={product.id}
                  className='bg-az-canvas border border-az-hairline-soft rounded-az-xl p-4 flex flex-col justify-between hover:shadow-sm transition-all duration-200 group'
                >
                  <div className='flex gap-4'>
                    <div className='relative h-20 w-20 rounded-az-xl overflow-hidden bg-az-surface-soft border border-az-hairline-soft flex-shrink-0'>
                      <Image
                        src={product.images[0] || '/placeholder.png'}
                        alt={product.name}
                        fill
                        className='object-contain group-hover:scale-105 transition-transform duration-300'
                        sizes='80px'
                      />
                    </div>
                    <div className='space-y-1 min-w-0'>
                      <span className='az-caption-bold text-az-stone uppercase tracking-wider block'>
                        {product.brand?.name || 'Genérica'}
                      </span>
                      <h3 className='az-body-sm-bold text-az-ink-deep truncate' title={product.name}>
                        {product.name}
                      </h3>
                      <p className='az-body-md-bold text-az-ink-deep tabular-nums'>
                        {formatCurrency(product.price)}
                      </p>
                      <p className='az-caption text-az-steel'>
                        Stock: <span className={totalStock > 2 ? 'text-az-success font-semibold' : 'text-az-attention font-semibold'}>{totalStock} u.</span>
                      </p>
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div className='mt-4 pt-3 border-t border-az-hairline-soft space-y-1.5'>
                    <span className='az-caption-bold text-az-stone uppercase tracking-wider block'>
                      Talle → Agregar:
                    </span>
                    <div className='flex flex-wrap gap-1.5'>
                      {product.variants.map((v) => {
                        const inCartQty = cart.find((item) => item.productId === product.id && item.size === v.size.name)?.qty || 0;
                        const remainingStock = v.stock - inCartQty;
                        const isOutOfStock = remainingStock <= 0;

                        return (
                          <button
                            key={v.id}
                            type='button'
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(product, v)}
                            className={`px-3 py-1.5 rounded-az-full az-caption-bold flex items-center gap-1 transition-all duration-150 ${
                              isOutOfStock
                                ? 'bg-az-surface-soft text-az-stone border border-az-hairline-soft line-through cursor-not-allowed'
                                : 'bg-az-surface-soft hover:bg-az-ink-deep hover:text-white text-az-ink border border-az-hairline-soft'
                            }`}
                          >
                            <span>{v.size.name}</span>
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
        <div className='bg-az-canvas border border-az-hairline-soft rounded-az-xl shadow-[rgba(20,22,26,0.3)_0px_1px_4px_0px] p-6 space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-az-hairline-soft pb-4'>
            <div className='flex items-center gap-2'>
              <Store className='h-5 w-5 text-az-steel' />
              <div>
                <h2 className='az-body-md-bold text-az-ink-deep'>Venta Actual</h2>
                <p className='az-caption text-az-steel'>Vendedor: {sellerName}</p>
              </div>
            </div>
            {cart.length > 0 && (
              <Button
                variant='ghost'
                onClick={() => setCart([])}
                className='az-caption-bold text-az-critical hover:text-az-critical hover:bg-red-50 px-2.5 h-8 rounded-az-full'
              >
                Vaciar
              </Button>
            )}
          </div>

          {/* Cart List */}
          <div className='max-h-[22vh] overflow-y-auto space-y-3 pr-1'>
            {cart.length === 0 ? (
              <div className='py-6 text-center az-body-sm text-az-stone'>
                El carrito está vacío. Agregá talles de productos a la izquierda.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className='flex items-center justify-between gap-3 p-3 bg-az-surface-soft/50 border border-az-hairline-soft rounded-az-xl hover:bg-az-surface-soft transition-all duration-150'
                >
                  <div className='min-w-0 flex-1 space-y-0.5'>
                    <h4 className='az-body-sm-bold text-az-ink-deep truncate'>{item.name}</h4>
                    <p className='az-caption text-az-steel'>
                      Talle: <span className='font-semibold text-az-charcoal'>{item.size}</span> · {formatCurrency(item.price)} c/u
                    </p>
                  </div>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex items-center border border-az-hairline-soft rounded-az-full bg-az-canvas overflow-hidden h-7'>
                      <button
                        type='button'
                        onClick={() => handleUpdateQty(item.productId, item.size, -1)}
                        className='px-2 hover:bg-az-surface-soft text-az-charcoal h-full flex items-center justify-center border-r border-az-hairline-soft'
                      >
                        data-testid="pos-item-dec"
                        <Minus className='h-3 w-3' />
                      </button>
                      <span className='px-3 az-caption-bold text-az-ink-deep min-w-[24px] text-center tabular-nums'>
                        {item.qty}
                      </span>
                      <button
                        type='button'
                        onClick={() => handleUpdateQty(item.productId, item.size, 1)}
                        className='px-2 hover:bg-az-surface-soft text-az-charcoal h-full flex items-center justify-center border-l border-az-hairline-soft'
                      >
                        <Plus className='h-3 w-3' />
                      </button>
                    </div>
                    <button
                      type='button'
                      onClick={() => handleRemoveItem(item.productId, item.size)}
                      className='text-az-stone hover:text-az-critical p-1 transition-colors'
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
          <div className='pt-4 border-t border-az-hairline-soft space-y-3.5'>
            <div className='flex justify-between items-center'>
              <h3 className='az-caption-bold text-az-stone uppercase tracking-wider'>
                Cliente de la Venta
              </h3>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsCreateModalOpen(true)}
                className='az-caption-bold text-az-ink-deep hover:bg-az-surface-soft h-7 px-3 rounded-az-full flex items-center gap-1.5'
              >
                <UserPlus className='h-3.5 w-3.5' />
                Nuevo Cliente
              </Button>
            </div>

            {/* Customer Search Autocomplete */}
            {!selectedCustomer ? (
              <div className='relative'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-az-stone h-3.5 w-3.5' />
                  <Input
                    data-testid='pos-customer-search'
                    type='text'
                  <Input
                    data-testid="pos-customer-search"
                    type="text"
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    className='pl-9 h-9 text-xs border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                  />
                </div>

                {/* Dropdown search results */}
                {showSearchResults && customerSearchQuery.trim() !== '' && (
                  <div className='absolute z-20 top-full left-0 right-0 mt-1 bg-az-canvas border border-az-hairline-soft rounded-az-xl shadow-lg max-h-56 overflow-y-auto p-1.5 space-y-1'>
                    {isSearchingCustomers ? (
                      <div className='py-4 text-center az-caption text-az-stone flex items-center justify-center gap-2'>
                        <Loader2 className='h-3.5 w-3.5 animate-spin text-az-steel' />
                        Buscando en la base de datos...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className='py-4 text-center az-caption text-az-stone'>
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
                          className='w-full text-left p-2.5 hover:bg-az-surface-soft rounded-az-lg flex flex-col gap-0.5 transition-colors border border-transparent hover:border-az-hairline-soft'
                        >
                          <span className='az-body-sm-bold text-az-ink-deep'>{cust.name}</span>
                          <span className='az-caption text-az-steel'>
                            {cust.dni ? `DNI: ${cust.dni}` : 'Sin DNI'} | {cust.email} {cust.phone ? `| Tel: ${cust.phone}` : ''}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className='bg-az-surface-soft border border-az-hairline-soft rounded-az-xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in duration-200'>
                <div className='flex items-center gap-2 min-w-0'>
                  <div className='bg-az-canvas h-7 w-7 rounded-az-full flex items-center justify-center border border-az-hairline-soft text-az-primary flex-shrink-0'>
                    <UserCheck className='h-4 w-4' />
                  </div>
                  <div className='min-w-0'>
                    <p className='az-body-sm-bold text-az-ink-deep truncate'>{selectedCustomer.name}</p>
                    <p className='az-caption text-az-steel truncate'>
                      {selectedCustomer.dni ? `DNI: ${selectedCustomer.dni}` : 'Sin DNI'} | {selectedCustomer.email}
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => setSelectedCustomer(null)}
                  className='text-az-stone hover:text-az-critical p-1 transition-colors'
                  title='Remover cliente'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            )}

            {/* Editable Fields */}
            <div className='grid grid-cols-2 gap-3 pt-1'>
              <div className='space-y-1'>
                <Label htmlFor='posCustName' className='az-caption-bold text-az-stone uppercase tracking-wider'>Nombre Completo</Label>
                <Input
                    data-testid='pos-customer-search'
                  id='posCustName'
                  placeholder='Consumidor Final'
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={!!selectedCustomer}
                  className='h-9 text-xs border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='posCustEmail' className='az-caption-bold text-az-stone uppercase tracking-wider'>Correo Electrónico</Label>
                <Input
                    data-testid='pos-customer-search'
                  id='posCustEmail'
                  type='email'
                  placeholder='consumidorfinal@local...'
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  disabled={!!selectedCustomer}
                  className='h-9 text-xs border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='posCustDni' className='az-caption-bold text-az-stone uppercase tracking-wider'>Documento (DNI)</Label>
                <Input
                    data-testid='pos-customer-search'
                  id='posCustDni'
                  placeholder='DNI del cliente'
                  value={customerDni}
                  onChange={(e) => setCustomerDni(e.target.value)}
                  disabled={!!selectedCustomer && !!selectedCustomer.dni}
                  className='h-9 text-xs border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='posCustPhone' className='az-caption-bold text-az-stone uppercase tracking-wider'>Teléfono de Contacto</Label>
                <Input
                    data-testid='pos-customer-search'
                  id='posCustPhone'
                  placeholder='Teléfono'
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={!!selectedCustomer && !!selectedCustomer.phone}
                  className='h-9 text-xs border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                />
              </div>
              <div className='col-span-2 space-y-1'>
                <Label htmlFor='posCustAddress' className='az-caption-bold text-az-stone uppercase tracking-wider'>Domicilio (Dirección)</Label>
                <Input
                    data-testid='pos-customer-search'
                  id='posCustAddress'
                  placeholder='Calle y número (ej. Comb. de las Piedras 1026)'
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  disabled={!!selectedCustomer && (selectedCustomer.address && selectedCustomer.address.streetAddress)}
                  className='h-9 text-xs border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                />
              </div>
            </div>
          </div>

          {/* Local Payment Methods */}
          <div className='pt-4 border-t border-az-hairline-soft space-y-3'>
            <h3 className='az-caption-bold text-az-stone uppercase tracking-wider'>
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
                    className={`flex items-center gap-2 border rounded-az-xl p-3 cursor-pointer transition-all duration-150 ${
                      active
                        ? 'border-az-primary bg-az-canvas shadow-sm text-az-primary font-semibold'
                        : 'border-az-hairline-soft text-az-charcoal hover:bg-az-surface-soft'
                    }`}
                  >
                    <RadioGroupItem value={method.id} className='sr-only' />
                    <Icon className={`h-4 w-4 ${active ? 'text-az-primary' : 'text-az-stone'}`} />
                    <span className='az-caption-bold'>{method.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Price Totals & Submit */}
          <div className='pt-4 border-t border-az-hairline-soft space-y-4'>
            <div className='space-y-2'>
              <div className='flex justify-between az-body-sm text-az-charcoal'>
                <span>Subtotal</span>
                <span className='tabular-nums'>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className='flex justify-between az-caption text-az-stone'>
                <span>Impuesto IVA (15%)</span>
                <span className='tabular-nums'>{formatCurrency(totals.tax)}</span>
              </div>
              <div className='flex justify-between border-t border-az-hairline-soft pt-3'>
                <span className='az-body-md-bold text-az-ink-deep'>Total a Cobrar</span>
                <span className='az-heading-sm text-az-ink-deep tabular-nums'>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <Button
              id='pos-register-sale'
              type='button'
              variant='buyCta'
              disabled={isPending || cart.length === 0}
              onClick={handleRegisterSale}
              className='w-full h-12'
            >
              {isPending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
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
        <div className='fixed inset-0 z-50 bg-az-ink-deep/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-az-canvas rounded-az-xxxl p-8 max-w-md w-full shadow-2xl border border-az-hairline-soft space-y-6 text-center animate-in zoom-in-95 duration-200'>
            <div className='mx-auto h-16 w-16 bg-az-surface-soft rounded-az-full flex items-center justify-center text-az-success'>
              <CheckCircle className='h-9 w-9' />
            </div>
            <div className='space-y-2'>
              <h3 className='az-heading-sm text-az-ink-deep'>¡Venta Registrada!</h3>
              <p className='az-body-sm text-az-steel'>La transacción fue guardada y el stock fue actualizado.</p>
            </div>
            <div className='p-4 bg-az-surface-soft rounded-az-xxl text-left space-y-2.5 border border-az-hairline-soft'>
              <div className='flex justify-between az-body-sm'>
                <span className='text-az-charcoal'>ID de la Venta:</span>
                <span className='font-mono az-body-sm-bold text-az-ink-deep'>{successOrder.orderId.substring(0, 8)}...</span>
              </div>
              <div className='flex justify-between az-body-sm'>
                <span className='text-az-charcoal'>Cliente:</span>
                <span className='az-body-sm-bold text-az-ink-deep truncate max-w-[200px] block text-right'>{customerName || 'Consumidor Final'}</span>
              </div>
              <div className='flex justify-between az-body-sm'>
                <span className='text-az-charcoal'>Total Cobrado:</span>
                <span className='az-body-sm-bold text-az-ink-deep tabular-nums'>{formatCurrency(successOrder.total)}</span>
              </div>
              <div className='flex justify-between az-body-sm'>
                <span className='text-az-charcoal'>Método de Pago:</span>
                <span className='az-body-sm-bold text-az-ink-deep'>
                  {paymentMethod.replace('PuntoDeVenta_', 'POS ')}
                </span>
              </div>
            </div>
            <div className='flex gap-3'>
              <Button
                variant='outlineLight'
                onClick={() => {
                  window.open(`/order/${successOrder.orderId}`, '_blank');
                }}
                className='flex-1 h-11'
              >
                <Receipt className='h-4 w-4' />
                Ver Comprobante
              </Button>
              <Button
                variant='buyCta'
                onClick={handleResetSale}
                className='flex-1 h-11'
              >
                Nueva Venta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOMER MODAL */}
      {isCreateModalOpen && (
        <div className='fixed inset-0 z-50 bg-az-ink-deep/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-az-canvas rounded-az-xxxl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-az-hairline-soft space-y-5 animate-in zoom-in-95 duration-200'>
            <div className='flex justify-between items-center border-b border-az-hairline-soft pb-3'>
              <h3 className='az-heading-sm text-az-ink-deep'>Registrar Nuevo Cliente</h3>
              <button
                type='button'
                onClick={() => setIsCreateModalOpen(false)}
                className='text-az-stone hover:text-az-ink p-1 transition-colors'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className='space-y-4'>
              <div className='grid grid-cols-2 gap-3.5'>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalName' className='az-caption-bold text-az-stone uppercase tracking-wider'>Nombre Completo *</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalName'
                    required
                    placeholder='Ej: Carlos Jimenez'
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    className='h-9 text-sm border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalEmail' className='az-caption-bold text-az-stone uppercase tracking-wider'>Email *</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalEmail'
                    type='email'
                    required
                    placeholder='ejemplo@correo.com'
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    className='h-9 text-sm border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalDni' className='az-caption-bold text-az-stone uppercase tracking-wider'>Documento (DNI)</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalDni'
                    placeholder='Ej: 38444555'
                    value={newCustomerForm.dni}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, dni: e.target.value })}
                    className='h-9 text-sm border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalPhone' className='az-caption-bold text-az-stone uppercase tracking-wider'>Teléfono de Contacto</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalPhone'
                    placeholder='Ej: 3814445555'
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className='h-9 text-sm border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                  />
                </div>
                <div className='col-span-2 space-y-1.5'>
                  <Label htmlFor='modalStreet' className='az-caption-bold text-az-stone uppercase tracking-wider'>Domicilio (Calle y Altura)</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalStreet'
                    placeholder='Ej: Comb. de las Piedras 1026'
                    value={newCustomerForm.streetAddress}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, streetAddress: e.target.value })}
                    className='h-9 text-sm border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalCity' className='az-caption-bold text-az-stone uppercase tracking-wider'>Ciudad</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalCity'
                    placeholder='Tucumán'
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                    className='h-9 text-sm border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='modalProvince' className='az-caption-bold text-az-stone uppercase tracking-wider'>Provincia</Label>
                  <Input
                    data-testid='pos-customer-search'
                    id='modalProvince'
                    placeholder='Tucumán'
                    value={newCustomerForm.province}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, province: e.target.value })}
                    className='h-9 text-sm border-az-hairline-soft focus-visible:ring-az-primary rounded-az-lg'
                  />
                </div>
              </div>

              <div className='flex justify-end gap-3 pt-4 border-t border-az-hairline-soft'>
                <Button
                  type='button'
                  variant='outlineLight'
                  onClick={() => setIsCreateModalOpen(false)}
                  className='h-10 px-5'
                >
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  variant='buyCta'
                  disabled={isCreatingCustomer}
                  className='h-10 px-5 flex items-center gap-1.5'
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
