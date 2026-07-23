import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'PrabuGym — Admin Dashboard',
  description: 'Sistem Terintegrasi Pengelolaan Cabang PrabuGym',
  icons: {
    icon: '/logo-transparent.png',
    shortcut: '/logo-transparent.png',
    apple: '/logo-transparent.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#F4F6F9] text-slate-800 antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
