'use client';

import { useEffect } from 'react';

export default function BannerActivator({ bannerId }: { bannerId: string }) {
  useEffect(() => {
    if (bannerId) {
      document.cookie = `activeBanner=${bannerId}; max-age=86400; path=/; SameSite=Lax`;
    }
  }, [bannerId]);
  return null;
}
