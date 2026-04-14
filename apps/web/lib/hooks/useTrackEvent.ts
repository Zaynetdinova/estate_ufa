'use client';

import { useCallback } from 'react';
import { eventsApi, type EventType } from '../api';
import { useAuthStore } from '../store/auth.store';

/**
 * Хук для трекинга событий.
 * fire-and-forget — ошибки не падают в UI.
 *
 * Использование:
 *   const track = useTrackEvent();
 *   track('VIEW_PROPERTY', { propertyId: 1, propertyName: 'ЖК Символ' }, 1);
 */
export function useTrackEvent() {
  const sessionId = useAuthStore((s) => s.sessionId);

  return useCallback(
    (
      eventType: EventType,
      payload: Record<string, unknown>,
      propertyId?: number,
    ) => {
      eventsApi
        .track({ eventType, payload, propertyId, sessionId })
        .catch(() => null); // silent fail
    },
    [sessionId],
  );
}
