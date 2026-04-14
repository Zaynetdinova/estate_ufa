import { AuthForm } from '@/components/ui/AuthForm';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Войти | Новостройки Уфы' };
export default function LoginPage() { return <AuthForm mode="login" />; }
