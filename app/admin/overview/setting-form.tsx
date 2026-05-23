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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex gap-2">
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            type="number" 
            min="0"
          />
          <Button onClick={handleSave} disabled={isPending || value === initialValue}>
            {isPending ? '...' : 'Guardar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
