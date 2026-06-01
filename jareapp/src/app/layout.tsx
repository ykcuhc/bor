import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import { AuthProvider } from '@/context/AuthContext';
import { NeighborhoodProvider } from '@/context/NeighborhoodContext';

export const metadata: Metadata = {
  title: {
    default:  'JareApp — Your Neighborhood, Connected',
    template: '%s | JareApp',
  },
  description: 'The local social platform for Kuwait neighborhoods. Connect with neighbors, stay safe, and discover local businesses.',
  keywords:    ['Kuwait', 'neighborhood', 'neighbors', 'community', 'local', 'social', 'جار'],
  authors:     [{ name: 'JareApp' }],
  manifest:    '/manifest.json',
  openGraph: {
    title:       'JareApp',
    description: 'Connect with your neighbors in Kuwait',
    type:        'website',
    locale:      'en_US',
    siteName:    'JareApp',
  },
  twitter: {
    card:        'summary',
    title:       'JareApp',
    description: 'Connect with your neighbors in Kuwait',
  },
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'default',
    title:          'JareApp',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor:    '#16a34a',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-gray-50">
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
