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
            'flex items-center gap-2.5 h-11 px-3.5 rounded-xl border border-[#e5e5e5]',
            'bg-white hover:bg-[#f5f5f5] transition-colors',
            'min-w-[180px]'
          )}
        >
          <span
            className='inline-block w-6 h-6 rounded-lg border border-[#e5e5e5] flex-shrink-0 shadow-xs'
            style={{ backgroundColor: safeValue }}
            aria-hidden
          />
          <span className='font-mono text-sm font-semibold flex-1 text-left text-[#111111]'>
            {safeValue.toUpperCase()}
          </span>
          <ChevronDown className='w-4 h-4 text-[#707072] flex-shrink-0' />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-[290px] p-4 z-[9999] bg-white border-[#e5e5e5] rounded-2xl shadow-xl'
      >
        {/* Presets grid */}
        <div className='space-y-2.5'>
          <p className='text-xs font-bold uppercase tracking-wider text-[#111111]'>
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
                  'w-5 h-5 rounded-md border transition-transform hover:scale-110',
                  isPreset && safeValue === preset
                    ? 'border-[#111111] ring-2 ring-black/40 scale-105'
                    : 'border-[#e5e5e5]'
                )}
                style={{ backgroundColor: preset }}
                aria-label={`Color ${preset}`}
                title={preset}
              />
            ))}
          </div>
        </div>

        {/* Custom hex */}
        <div className='mt-3.5 pt-3.5 border-t border-[#e5e5e5] space-y-2'>
          <p className='text-xs font-bold uppercase tracking-wider text-[#111111]'>
            Hex personalizado
          </p>
          <div className='flex items-center gap-2'>
            <span
              className='inline-block w-8 h-8 rounded-lg border border-[#e5e5e5] flex-shrink-0 shadow-xs'
              style={{ backgroundColor: safeValue }}
              aria-hidden
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder='#dc2626'
              maxLength={7}
              className='font-mono flex-1 bg-white border-[#e5e5e5] rounded-xl text-[#111111] h-10'
              autoComplete='off'
              spellCheck={false}
            />
            {isValidHex(safeValue) && (
              <Check className='w-4 h-4 text-emerald-600 flex-shrink-0' />
            )}
          </div>
          {value && !isValidHex(value) && (
            <p className='text-xs text-red-600 font-medium'>
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
