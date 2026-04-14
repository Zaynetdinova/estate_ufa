import { LeadsDashboard } from '@/components/admin/LeadsDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Лиды | Панель управления' };

export default function AdminLeadsPage() {
  return <LeadsDashboard />;
}
