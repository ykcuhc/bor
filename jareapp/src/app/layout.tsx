import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import { AuthProvider } from '@/context/AuthContext';
import { NeighborhoodProvider } from '@/context/NeighborhoodContext';

export const metadata: Metadata = {
  title:       'JareApp — Your Neighborhood, Connected',
  description: 'The local social platform for Kuwait neighborhoods. Connect with neighbors, stay safe, and discover local businesses.',
  keywords:    ['Kuwait', 'neighborhood', 'neighbors', 'community', 'local', 'social'],
  openGraph: {
    title:       'JareApp',
    description: 'Connect with your neighbors in Kuwait',
    type:        'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-gray-50">
        {/*
          Providers wrap the entire app:
          - AuthProvider:         Supabase session + user profile
          - NeighborhoodProvider: Currently selected geographical context
        */}
        <AuthProvider>
          <NeighborhoodProvider>
            <Header />
            <main className="pt-4">{children}</main>
          </NeighborhoodProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
