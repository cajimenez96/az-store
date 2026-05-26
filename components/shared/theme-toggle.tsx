'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className='h-9 w-9 rounded-az-full bg-az-surface-soft animate-pulse' />
    );
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant='ghost'
      size='icon'
      className='h-9 w-9 rounded-az-full text-az-ink hover:text-az-ink-deep hover:bg-az-surface-soft transition-colors'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
    </Button>
  );
};

export default ThemeToggle;
