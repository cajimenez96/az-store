'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface ColorPickerFieldProps {
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
}

const DEFAULT_PRESETS = [
  '#000000', '#ffffff', '#dc2626', '#ef4444', '#f97316', '#f59e0b',
  '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c', '#57534e', '#44403c', '#1e293b',
  '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#1e3a8a', '#3f3f46',
];

/**
 * Custom color picker (no usa <input type="color"> que tiene problemas
 * cross-browser con value controlado y validación Zod).
 *
 * UI: un swatch trigger + popover con presets (grilla clickeable) + input
 * hex controlado.
 */
export function ColorPickerField({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
}: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false);

  const safeValue = isValidHex(value) ? value : '#000000';
  const isPreset = presets.includes(safeValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label='Seleccionar color'
          className={cn(
            'flex items-center gap-2 h-10 px-3 rounded-md border border-az-hairline',
            'bg-az-canvas hover:bg-az-surface-soft transition-colors',
            'min-w-[180px]'
          )}
        >
          <span
            className='inline-block w-6 h-6 rounded-md border border-az-hairline flex-shrink-0'
            style={{ backgroundColor: safeValue }}
            aria-hidden
          />
          <span className='font-mono az-body-sm flex-1 text-left'>
            {safeValue.toUpperCase()}
          </span>
          <ChevronDown className='w-4 h-4 text-az-stone flex-shrink-0' />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-[280px] p-3 z-[9999] bg-az-canvas border-az-hairline-soft'
      >
        {/* Presets grid */}
        <div className='space-y-2'>
          <p className='az-caption-bold text-az-stone uppercase tracking-wider'>
            Paleta
          </p>
          <div className='grid grid-cols-10 gap-1.5'>
            {presets.map((preset) => (
              <button
                key={preset}
                type='button'
                onClick={() => {
                  onChange(preset);
                  setOpen(false);
                }}
                className={cn(
                  'w-6 h-6 rounded border transition-transform hover:scale-110',
                  isPreset && safeValue === preset
                    ? 'border-az-ink-deep ring-2 ring-az-primary/40'
                    : 'border-az-hairline'
                )}
                style={{ backgroundColor: preset }}
                aria-label={`Color ${preset}`}
                title={preset}
              />
            ))}
          </div>
        </div>

        {/* Custom hex */}
        <div className='mt-3 pt-3 border-t border-az-hairline-soft space-y-2'>
          <p className='az-caption-bold text-az-stone uppercase tracking-wider'>
            Hex personalizado
          </p>
          <div className='flex items-center gap-2'>
            <span
              className='inline-block w-8 h-8 rounded border border-az-hairline flex-shrink-0'
              style={{ backgroundColor: safeValue }}
              aria-hidden
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder='#dc2626'
              maxLength={7}
              className='font-mono flex-1'
              autoComplete='off'
              spellCheck={false}
            />
            {isValidHex(safeValue) && (
              <Check className='w-4 h-4 text-az-success flex-shrink-0' />
            )}
          </div>
          {value && !isValidHex(value) && (
            <p className='az-caption text-az-critical'>
              Formato inválido. Usá #RRGGBB (ej: #dc2626).
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function isValidHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}
