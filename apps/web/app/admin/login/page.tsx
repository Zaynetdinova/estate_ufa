import type { Metadata } from 'next';
import { StaffLoginForm } from '@/components/admin/StaffLoginForm';

export const metadata: Metadata = { title: 'Вход для сотрудников | Панель управления' };

export default function StaffLoginPage() {
  return <StaffLoginForm />;
}
