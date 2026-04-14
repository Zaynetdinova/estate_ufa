import { AuthForm } from '@/components/ui/AuthForm';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Регистрация | Новостройки Уфы' };
export default function RegisterPage() { return <AuthForm mode="register" />; }
