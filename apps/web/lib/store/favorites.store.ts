'use client';

import { create } from 'zustand';

interface FavoritesState {
  ids:        Set<number>;
  isLoaded:   boolean;
  toggle:     (propertyId: number) => Promise<void>;
  load:       () => Promise<void>;
  reset:      () => void;
  has:        (propertyId: number) => boolean;
}

async function apiFetch(path: string, method = 'GET') {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids:      new Set<number>(),
  isLoaded: false,

  has: (propertyId) => get().ids.has(propertyId),

  reset: () => set({ ids: new Set<number>(), isLoaded: false }),

  load: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    try {
      const { ids } = await apiFetch('/favorites/ids');
      set({ ids: new Set(ids as number[]), isLoaded: true });
    } catch {
      // not logged in
    }
  },

  toggle: async (propertyId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // optimistic update
    const ids = new Set(get().ids);
    if (ids.has(propertyId)) {
      ids.delete(propertyId);
    } else {
      ids.add(propertyId);
    }
    set({ ids });

    try {
      await apiFetch(`/favorites/${propertyId}`, 'POST');
    } catch {
      // rollback
      const rollback = new Set(get().ids);
      if (rollback.has(propertyId)) rollback.delete(propertyId);
      else rollback.add(propertyId);
      set({ ids: rollback });
    }
  },
}));
