export enum N8nEventType {
  USER_MESSAGE       = 'USER_MESSAGE',
  VIEW_PROPERTY      = 'VIEW_PROPERTY',
  CALCULATOR_USED    = 'CALCULATOR_USED',
  REQUEST_SELECTION  = 'REQUEST_SELECTION',
  ADD_FAVORITE       = 'ADD_FAVORITE',
  NEW_LEAD           = 'NEW_LEAD',
  AUTH_LOGIN         = 'AUTH_LOGIN',
}

export interface N8nEvent<T = Record<string, unknown>> {
  eventType: N8nEventType;
  userId?: number;
  sessionId?: string;
  timestamp: string;
  payload: T;
}

// Payload-типы для каждого события
export interface UserMessagePayload {
  message: string;
  sessionId: string;
  budgetMin?: number;
  budgetMax?: number;
  intent?: string;
}

export interface ViewPropertyPayload {
  propertyId: number;
  propertyName: string;
  propertySlug: string;
  timeSpent?: number; // секунды
}

export interface CalculatorUsedPayload {
  propertyId?: number;
  price: number;
  yieldPct: number;
  paybackYears: number;
}

export interface RequestSelectionPayload {
  budgetMin?: number;
  budgetMax?: number;
  preferences?: Record<string, unknown>;
}

export interface NewLeadPayload {
  leadId: number;
  source: string;
  score: number;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  budgetMin?: number;
  budgetMax?: number;
  intent?: string;
  snapshot?: Record<string, unknown>;
}
