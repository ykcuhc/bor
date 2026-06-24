import Link from 'next/link';
import { Globe, Globe2, Link2 } from 'lucide-react';

const FOOTER_LINKS = {
  'Shop': [
    { label: 'Women',      href: '/search?category=Women' },
    { label: 'Men',        href: '/search?category=Men' },
    { label: 'Kids',       href: '/search?category=Kids' },
    { label: 'Home Decor', href: '/search?category=Home' },
    { label: 'Beauty',     href: '/search?category=Beauty' },
  ],
  'Sell': [
    { label: 'Start Selling', href: '/sell' },
    { label: 'Selling Tips',  href: '/help/selling' },
    { label: 'Pricing Guide', href: '/help/pricing' },
    { label: 'Shipping Info', href: '/help/shipping' },
  ],
  'Support': [
    { label: 'Help Center',   href: '/help' },
    { label: 'How It Works',  href: '/about' },
    { label: 'Buyer Protection', href: '/help/buyer-protection' },
    { label: 'Contact Us',    href: '/contact' },
  ],
  'Company': [
    { label: 'About Miova.', href: '/about' },
    { label: 'Careers',       href: '/careers' },
    { label: 'Press',         href: '/press' },
    { label: 'Blog',          href: '/blog' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <span className="text-2xl font-bold text-white">Miova<span className="text-accent-400">.</span></span>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Kuwait&apos;s fashion marketplace.
              Buy and sell from thousands of closets — safely, easily, and from home.
            </p>
            <div className="flex gap-3 mt-5">
              {[Globe, Globe2, Link2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-brand-600 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{heading}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Miova. · Kuwait. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-gray-300 transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-gray-300 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
