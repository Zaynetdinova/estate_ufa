import type { Metadata } from 'next';
import { NavBar } from '@/components/ui/NavBar';
import { AuthHydrator } from '@/components/ui/AuthHydrator';

export const metadata: Metadata = {
  title:       'Новостройки Уфы — AI-подбор квартиры',
  description: 'Найди квартиру в новостройке Уфы с помощью AI-консультанта. Каталог ЖК, калькулятор инвестиций, персональные рекомендации.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Unbounded:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: 'Manrope, sans-serif', background: '#F7F9FC', color: '#0F1923', margin: 0, minHeight: '100vh' }}>
        <AuthHydrator />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
