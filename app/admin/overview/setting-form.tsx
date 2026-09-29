'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { setSetting } from '@/lib/actions/setting.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingForm({
  settingKey,
  initialValue,
  label,
  description
}: {
  settingKey: string;
  initialValue: string;
  label: string;
  description: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsPending(true);
    const res = await setSetting(settingKey, value);
    setIsPending(false);

    if (res.success) {
      toast({ description: res.message });
    } else {
      toast({ variant: 'destructive', description: res.message });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 h-full flex flex-col justify-between shadow-none">
      <div>
        <h2 className="text-xl font-medium tracking-tight text-[#111111] font-marder-display mb-1">{label}</h2>
        <p className="text-xs text-[#707072] mb-6">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          type="number" 
          min="0"
          className="bg-[#f5f5f5] border-transparent rounded-full text-sm font-medium text-[#111111] focus-visible:ring-2 focus-visible:ring-[#111111] focus:bg-white max-w-[140px]"
        />
        <Button 
          onClick={handleSave} 
          disabled={isPending || value === initialValue}
          className="rounded-full bg-[#111111] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider px-6 h-10 transition-colors"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
