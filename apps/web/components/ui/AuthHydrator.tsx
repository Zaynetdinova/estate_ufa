'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';

/** Восстанавливает сессию из localStorage при загрузке приложения */
export function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return null;
}
