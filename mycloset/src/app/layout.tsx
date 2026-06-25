import type { Metadata } from 'next';
import { Quicksand, Plus_Jakarta_Sans, Space_Mono, Playfair_Display, Nunito } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Toast from '@/components/ui/Toast';
import OfferModal from '@/components/ui/OfferModal';
import AuthProvider from '@/components/AuthProvider';

const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-quicksand' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '900'], style: ['normal', 'italic'], variable: '--font-playfair' });
const nunito = Nunito({ subsets: ['latin'], weight: ['900'], variable: '--font-nunito' });

export const metadata: Metadata = {
  title: "Miova. — Kuwait's Fashion Marketplace",
  description: 'Buy and sell fashion, accessories, and more from thousands of closets across Kuwait.',
  keywords: ['Kuwait', 'fashion', 'marketplace', 'buy', 'sell', 'clothing', 'accessories'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${quicksand.variable} ${jakarta.variable} ${spaceMono.variable} ${playfair.variable} ${nunito.variable} bg-gray-50 min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toast />
          <OfferModal />
        </AuthProvider>
      </body>
    </html>
  );
}
